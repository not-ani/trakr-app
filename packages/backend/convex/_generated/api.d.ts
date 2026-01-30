/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as feed from "../feed.js";
import type * as friends from "../friends.js";
import type * as habits from "../habits.js";
import type * as healthCheck from "../healthCheck.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as notifications from "../notifications.js";
import type * as privateData from "../privateData.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  feed: typeof feed;
  friends: typeof friends;
  habits: typeof habits;
  healthCheck: typeof healthCheck;
  "lib/helpers": typeof lib_helpers;
  notifications: typeof notifications;
  privateData: typeof privateData;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
