import AppLayout from "./components/layout/AppLayout";
import AppErrorBoundary from "./components/common/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary scope="App">
      <AppLayout />
    </AppErrorBoundary>
  );
}
