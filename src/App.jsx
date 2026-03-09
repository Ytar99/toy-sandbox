"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Watchlist Board</h1>
        <SignOutButton />
      </header>
      <main className="p-8 flex flex-col gap-16">
        <Authenticated>
          <Board />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-dark dark:text-light rounded-md px-2 py-1"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState("signIn");
  const [error, setError] = useState(null);
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the watchlist board</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <input
          className="bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="email"
          name="email"
          placeholder="Email"
        />
        <input
          className="bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
          type="password"
          name="password"
          placeholder="Password"
        />
        <button
          className="bg-dark dark:bg-light text-light dark:text-dark rounded-md"
          type="submit"
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <span
            className="text-dark dark:text-light underline hover:no-underline cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
            <p className="text-dark dark:text-light font-mono text-xs">
              Error signing in: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function Board() {
  const [showHistory, setShowHistory] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ title: "", episode: "", link: "" });

  const currentItems = useQuery(api.items.getCurrentItems);
  const historyItems = useQuery(api.items.getHistoryItems);
  const currentUser = useQuery(api.users.getCurrentUser);

  const addItem = useMutation(api.items.addItem);
  const updateItem = useMutation(api.items.updateItem);
  const deleteItem = useMutation(api.items.deleteItem);
  const markWatched = useMutation(api.items.markWatched);

  // Interleave items: group by user, sort each user's items by creation time, then round‑robin
  const interleavedItems = (() => {
    if (!currentItems) return [];
    const groups = {};
    currentItems.forEach((item) => {
      if (!groups[item.userId]) groups[item.userId] = [];
      groups[item.userId].push(item);
    });
    for (const userId in groups) {
      groups[userId].sort((a, b) => a._creationTime - b._creationTime);
    }
    const userIds = Object.keys(groups);
    if (userIds.length === 0) return [];
    const result = [];
    const maxLen = Math.max(...userIds.map((uid) => groups[uid].length));
    for (let i = 0; i < maxLen; i++) {
      for (const uid of userIds) {
        if (i < groups[uid].length) {
          result.push(groups[uid][i]);
        }
      }
    }
    return result;
  })();

  if (
    currentItems === undefined ||
    historyItems === undefined ||
    currentUser === undefined
  ) {
    return <div>Loading...</div>;
  }

  const handleAddItem = (e) => {
    e.preventDefault();
    addItem(newItem).then(() =>
      setNewItem({ title: "", episode: "", link: "" }),
    );
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    updateItem(editingItem).then(() => setEditingItem(null));
  };

  const handleDelete = (itemId) => {
    if (confirm("Are you sure?")) {
      deleteItem({ itemId });
    }
  };

  const handleMarkWatched = (itemId) => {
    markWatched({ itemId });
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Current Watchlist</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setShowHistory(true)}
        >
          View History
        </button>
      </div>

      {/* Add new item form */}
      <form
        onSubmit={handleAddItem}
        className="mb-8 p-4 border rounded flex flex-col gap-2"
      >
        <input
          className="border p-2 rounded"
          placeholder="Title"
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
          required
        />
        <input
          className="border p-2 rounded"
          placeholder="Episode (e.g., S01E05)"
          value={newItem.episode}
          onChange={(e) => setNewItem({ ...newItem, episode: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          placeholder="Link (URL)"
          value={newItem.link}
          onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Add to watchlist
        </button>
      </form>

      {/* Interleaved items list */}
      <div className="space-y-2">
        {interleavedItems.map((item) => (
          <div
            key={item._id}
            className="border p-4 rounded flex justify-between items-start"
          >
            <div>
              <div className="font-semibold">{item.userName}</div>
              <div className="text-lg">{item.title}</div>
              {item.episode && (
                <div className="text-sm text-gray-600">
                  Episode: {item.episode}
                </div>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm"
                >
                  Link
                </a>
              )}
            </div>
            {item.userId === currentUser?._id && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleMarkWatched(item._id)}
                  className="text-green-500 hover:underline"
                >
                  Watched
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {interleavedItems.length === 0 && (
          <p>No items in watchlist. Add some!</p>
        )}
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded w-96">
            <h3 className="text-xl mb-4">Edit Item</h3>
            <form onSubmit={handleUpdateItem} className="flex flex-col gap-2">
              <input
                className="border p-2 rounded"
                placeholder="Title"
                value={editingItem.title}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Episode"
                value={editingItem.episode || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, episode: e.target.value })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="Link"
                value={editingItem.link || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, link: e.target.value })
                }
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">History</h3>
              <button onClick={() => setShowHistory(false)} className="text-xl">
                &times;
              </button>
            </div>
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div key={item._id} className="border p-4 rounded">
                  <div className="font-semibold">{item.userName}</div>
                  <div>{item.title}</div>
                  {item.episode && (
                    <div className="text-sm text-gray-600">
                      Episode: {item.episode}
                    </div>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm"
                    >
                      Link
                    </a>
                  )}
                </div>
              ))}
              {historyItems.length === 0 && <p>No watched items yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
