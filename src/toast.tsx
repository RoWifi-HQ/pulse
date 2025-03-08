import type { AriaToastProps, AriaToastRegionProps } from "@react-aria/toast";
import type { ToastState } from "@react-stately/toast";
import { ToastQueue, useToastQueue } from "@react-stately/toast";
import { createPortal } from "react-dom";
import { useToastRegion, useToast } from "@react-aria/toast";
import { useRef } from "react";

interface CustomToastProps {
  success: boolean;
  description: string;
}

export const toast_queue = new ToastQueue<CustomToastProps>({
  maxVisibleToasts: 5,
});

export function GlobalToastRegion(props: AriaToastRegionProps) {
  let state = useToastQueue(toast_queue);

  return state.visibleToasts.length > 0
    ? createPortal(<ToastRegion {...props} state={state} />, document.body)
    : null;
}

interface ToastRegionProps extends AriaToastRegionProps {
  state: ToastState<CustomToastProps>;
}

function ToastRegion({ state, ...props }: ToastRegionProps) {
  let ref = useRef(null);
  let { regionProps } = useToastRegion(props, state, ref);

  return (
    <div
      {...regionProps}
      ref={ref}
      className="fixed bottom-0 right-0 flex flex-col p-8 w-[390px] z-50 outline-hidden"
    >
      {state.visibleToasts.map((toast) => (
        <Toast key={toast.key} toast={toast} state={state} />
      ))}
    </div>
  );
}

interface ToastProps extends AriaToastProps<CustomToastProps> {
  state: ToastState<CustomToastProps>;
}

function Toast({ state, ...props }: ToastProps) {
  let ref = useRef(null);
  let { toastProps, contentProps, titleProps } = useToast(props, state, ref);

  return (
    <div
      {...toastProps}
      ref={ref}
      className="rounded-lg shadow-lg p-6 bg-neutral-900"
    >
      <div {...contentProps}>
        <div {...titleProps} className="text-sm flex items-center w-full gap-8">
          {props.toast.content.success ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-emerald-600"
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
              className="size-10 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          )}
          {props.toast.content.description}
        </div>
      </div>
    </div>
  );
}
