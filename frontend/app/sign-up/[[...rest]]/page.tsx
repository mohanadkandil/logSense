import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-200/30 via-purple-200/20 to-green-200/30">
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/20 via-transparent to-blue-100/20" />
      <div className="relative">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl",
            },
          }}
          redirectUrl="/app"
        />
      </div>
    </div>
  );
}