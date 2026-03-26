"use client";

import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

export function ToastProvider() {
  return (
    <ToastContainer
      autoClose={3200}
      closeOnClick
      hideProgressBar={false}
      newestOnTop
      pauseOnHover
      position="top-right"
      theme="light"
    />
  );
}
