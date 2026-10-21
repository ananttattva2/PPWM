"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useWorkspace } from "./workspace-context";
let database: Promise<IDBDatabase> | undefined;
function drafts() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("ppwm-assessment-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}
export function useDraftState<T>(
  field: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const { userId } = useWorkspace();
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const changed = useRef(false);
  const key = useRef("");
  useEffect(() => {
    let live = true;
    const component =
      new URLSearchParams(window.location.search).get("component") || "";
    key.current = `${userId}:${window.location.pathname}:${component}:${field}`;
    drafts()
      .then((db) => {
        const request = db
          .transaction("drafts")
          .objectStore("drafts")
          .get(key.current);
        request.onsuccess = () => {
          if (live) {
            if (request.result !== undefined && !changed.current)
              setValue(request.result as T);
            setReady(true);
          }
        };
        request.onerror = () => {
          if (live) setReady(true);
        };
      })
      .catch(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [field, userId]);
  useEffect(() => {
    if (!ready) return;
    drafts()
      .then((db) => {
        db.transaction("drafts", "readwrite")
          .objectStore("drafts")
          .put(value, key.current);
      })
      .catch(() => {});
  }, [ready, value]);
  return [
    value,
    (next) => {
      changed.current = true;
      setValue(next);
    },
  ];
}
