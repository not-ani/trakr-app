import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/helpers";

export const sendRequest = mutation({
  args: { addresseeId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    if (args.addresseeId === user.userId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existing1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user.userId).eq("addresseeId", args.addresseeId)
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
        fromUserId: user.userId,
        type: "friend_request",
        read: false,
      });

      return existing1._id;
    }

    const existing2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", args.addresseeId).eq("addresseeId", user.userId)
      )
      .unique();

    if (existing2) {
      if (existing2.status === "pending") {
        // They already sent us a request - auto accept
        await ctx.db.patch(existing2._id, { status: "accepted" });

        // Notify them
        await ctx.db.insert("notifications", {
          userId: args.addresseeId,
          fromUserId: user.userId,
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
      requesterId: user.userId,
      addresseeId: args.addresseeId,
      status: "pending",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.addresseeId,
      fromUserId: user.userId,
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

    if (friendship.addresseeId !== user.userId) {
      throw new Error("Not authorized");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request already processed");
    }

    await ctx.db.patch(args.friendshipId, { status: "accepted" });

    // Notify requester
    await ctx.db.insert("notifications", {
      userId: friendship.requesterId,
      fromUserId: user.userId,
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

    if (friendship.addresseeId !== user.userId) {
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
  args: { friendId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Find the friendship in either direction
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user.userId).eq("addresseeId", args.friendId)
      )
      .unique();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
      return;
    }

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", args.friendId).eq("addresseeId", user.userId)
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
      .withIndex("by_requester", (q) => q.eq("requesterId", user.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get friendships where user is addressee
    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee_status", (q) =>
        q.eq("addresseeId", user.userId).eq("status", "accepted")
      )
      .collect();

    // Return just the Clerk user IDs - frontend will use Clerk hooks to get user data
    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    return friendIds;
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
        q.eq("addresseeId", user.userId).eq("status", "pending")
      )
      .collect();

    // Return just the friendship info with requester ID - frontend will use Clerk hooks
    const requests = pending.map((friendship) => ({
      friendshipId: friendship._id,
      requesterId: friendship.requesterId,
      createdAt: friendship._creationTime,
    }));

    return requests;
  },
});



export const sendRequestByClerkId = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    if (args.clerkUserId === user.userId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existing1 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", user.userId).eq("addresseeId", args.clerkUserId)
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
        userId: args.clerkUserId,
        fromUserId: user.userId,
        type: "friend_request",
        read: false,
      });
      return existing1._id;
    }

    const existing2 = await ctx.db
      .query("friendships")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", args.clerkUserId).eq("addresseeId", user.userId)
      )
      .unique();

    if (existing2) {
      if (existing2.status === "pending") {
        await ctx.db.patch(existing2._id, { status: "accepted" });
        await ctx.db.insert("notifications", {
          userId: args.clerkUserId,
          fromUserId: user.userId,
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
      requesterId: user.userId,
      addresseeId: args.clerkUserId,
      status: "pending",
    });

    await ctx.db.insert("notifications", {
      userId: args.clerkUserId,
      fromUserId: user.userId,
      type: "friend_request",
      read: false,
    });

    return friendshipId;
  },
});
