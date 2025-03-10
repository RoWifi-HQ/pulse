import { Toaster, toast } from "sonner";

interface CustomToastProps {
  success: boolean;
  description: string;
}

export const toast_queue = {
  add: (props: CustomToastProps, options?: { timeout?: number }) => {
    const { success, description } = props;
    const toastFunction = success ? toast.success : toast.error;

    toastFunction(description, {
      duration: options?.timeout || 5000,
      icon: success ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6 text-red-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    });
  },
};

export function GlobalToastRegion() {
  return (
    <Toaster
      expand
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#262626",
          color: "white",
          border: "none",
        },
        className: "rounded-lg shadow-lg p-6",
      }}
    />
  );
}
