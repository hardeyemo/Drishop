export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-3 py-10 sm:px-4 sm:py-14">
      {children}
    </div>
  );
}
