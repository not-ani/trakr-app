import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser, areFriends } from "./lib/helpers";
import { Doc, Id } from "./_generated/dataModel";

export const sendRequest = mutation({
  args: { addresseeId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    if (args.addresseeId === user._id) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if addressee exists
    const addressee = await ctx.db.get(args.addresseeId);
    if (!addressee) {
      throw new Error("User not found");
    }

    // Check if friendship already exists in either direction
    const existing1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user._id).eq("addresseeId", args.addresseeId)
      )
      .unique();

    if (existing1) {
      if (existing1.status === "pending") {
        throw new Error("Friend request already sent");
      }
      if (existing1.status === "accepted") {
        throw new Error("Already friends");
      }
      // If rejected, allow re-sending by updating status
      await ctx.db.patch(existing1._id, { status: "pending" });

      // Create notification
      await ctx.db.insert("notifications", {
        userId: args.addresseeId,
        fromUserId: user._id,
        type: "friend_request",
        read: false,
      });

      return existing1._id;
    }

    const existing2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", args.addresseeId).eq("addresseeId", user._id)
      )
      .unique();

    if (existing2) {
      if (existing2.status === "pending") {
        // They already sent us a request - auto accept
        await ctx.db.patch(existing2._id, { status: "accepted" });

        // Notify them
        await ctx.db.insert("notifications", {
          userId: args.addresseeId,
          fromUserId: user._id,
          type: "friend_accepted",
          read: false,
        });

        return existing2._id;
      }
      if (existing2.status === "accepted") {
        throw new Error("Already friends");
      }
    }

    // Create new friendship request
    const friendshipId = await ctx.db.insert("friendships", {
      requesterId: user._id,
      addresseeId: args.addresseeId,
      status: "pending",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.addresseeId,
      fromUserId: user._id,
      type: "friend_request",
      read: false,
    });

    return friendshipId;
  },
});

export const acceptRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.addresseeId !== user._id) {
      throw new Error("Not authorized");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.friendshipId, { status: "accepted" });

    // Notify requester
    await ctx.db.insert("notifications", {
      userId: friendship.requesterId,
      fromUserId: user._id,
      type: "friend_accepted",
      read: false,
    });

    return args.friendshipId;
  },
});

export const rejectRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.addresseeId !== user._id) {
      throw new Error("Not authorized");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.friendshipId, { status: "rejected" });
    return args.friendshipId;
  },
});

export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Find the friendship in either direction
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user._id).eq("addresseeId", args.friendId)
      )
      .unique();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
      return;
    }

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", args.friendId).eq("addresseeId", user._id)
      )
      .unique();

    if (friendship2) {
      await ctx.db.delete(friendship2._id);
      return;
    }

    throw new Error("Friendship not found");
  },
});

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    // Get friendships where user is requester
    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get friendships where user is addressee
    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee_status", (q) =>
        q.eq("addresseeId", user._id).eq("status", "accepted")
      )
      .collect();

    // Get friend user data
    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    const friends = await Promise.all(
      friendIds.map(async (id) => {
        const friend = await ctx.db.get(id);
        if (!friend) return null;
        return {
          _id: friend._id,
          username: friend.username,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    // Get pending requests sent to this user
    const pending = await ctx.db
      .query("friendships")
      .withIndex("by_addressee_status", (q) =>
        q.eq("addresseeId", user._id).eq("status", "pending")
      )
      .collect();

    // Get requester data
    const requests = await Promise.all(
      pending.map(async (friendship) => {
        const requester = await ctx.db.get(friendship.requesterId);
        if (!requester) return null;
        return {
          friendshipId: friendship._id,
          user: {
            _id: requester._id,
            username: requester.username,
            displayName: requester.displayName,
            avatarUrl: requester.avatarUrl,
          },
          createdAt: friendship._creationTime,
        };
      })
    );

    return requests.filter(Boolean);
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const query = args.query.toLowerCase();

    if (query.length < 2) {
      return [];
    }

    // Search by username (prefix match)
    const byUsername = await ctx.db
      .query("users")
      .withIndex("by_username")
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), user._id),
          q.neq(q.field("username"), undefined)
        )
      )
      .collect();

    const matches = byUsername.filter(
      (u) => u.username && u.username.toLowerCase().startsWith(query)
    );

    // Check friendship status for each match
    const results = await Promise.all(
      matches.slice(0, 20).map(async (match) => {
        const isFriend = await areFriends(ctx, user._id, match._id);

        // Check for pending request
        const pendingOutgoing = await ctx.db
          .query("friendships")
          .withIndex("by_pair", (q) =>
            q.eq("requesterId", user._id).eq("addresseeId", match._id)
          )
          .unique();

        const pendingIncoming = await ctx.db
          .query("friendships")
          .withIndex("by_pair", (q) =>
            q.eq("requesterId", match._id).eq("addresseeId", user._id)
          )
          .unique();

        let status: "none" | "friends" | "pending_outgoing" | "pending_incoming" = "none";
        if (isFriend) {
          status = "friends";
        } else if (pendingOutgoing?.status === "pending") {
          status = "pending_outgoing";
        } else if (pendingIncoming?.status === "pending") {
          status = "pending_incoming";
        }

        return {
          _id: match._id,
          username: match.username,
          displayName: match.displayName,
          avatarUrl: match.avatarUrl,
          status,
        };
      })
    );

    return results;
  },
});

export const sendRequestByUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const username = args.username.toLowerCase();

    const addressee = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (!addressee) {
      throw new Error("User not found");
    }

    if (addressee._id === user._id) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Reuse sendRequest logic
    // Check if friendship already exists in either direction
    const existing1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user._id).eq("addresseeId", addressee._id)
      )
      .unique();

    if (existing1) {
      if (existing1.status === "pending") {
        throw new Error("Friend request already sent");
      }
      if (existing1.status === "accepted") {
        throw new Error("Already friends");
      }
      await ctx.db.patch(existing1._id, { status: "pending" });
      await ctx.db.insert("notifications", {
        userId: addressee._id,
        fromUserId: user._id,
        type: "friend_request",
        read: false,
      });
      return existing1._id;
    }

    const existing2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", addressee._id).eq("addresseeId", user._id)
      )
      .unique();

    if (existing2) {
      if (existing2.status === "pending") {
        await ctx.db.patch(existing2._id, { status: "accepted" });
        await ctx.db.insert("notifications", {
          userId: addressee._id,
          fromUserId: user._id,
          type: "friend_accepted",
          read: false,
        });
        return existing2._id;
      }
      if (existing2.status === "accepted") {
        throw new Error("Already friends");
      }
    }

    const friendshipId = await ctx.db.insert("friendships", {
      requesterId: user._id,
      addresseeId: addressee._id,
      status: "pending",
    });

    await ctx.db.insert("notifications", {
      userId: addressee._id,
      fromUserId: user._id,
      type: "friend_request",
      read: false,
    });

    return friendshipId;
  },
});
