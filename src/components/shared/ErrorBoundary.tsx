import { Component, type ReactNode } from "react";
import { AlertTriangleIcon } from "@/components/icons/AppIcons";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="rounded-xl bg-white shadow-sm border border-red-100 p-8 max-w-md text-center">
            <AlertTriangleIcon className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">发生错误</h2>
            <p className="text-sm text-gray-500 mb-4 break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
