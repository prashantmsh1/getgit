import React from "react";
import { SignIn } from "@clerk/nextjs";

const page = () => {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <SignIn />
    </div>
  );
};

export default page;
