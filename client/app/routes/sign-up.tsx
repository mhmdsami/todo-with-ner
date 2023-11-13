import { Form, Link, useActionData } from "@remix-run/react";
import { createUserSession, getUserId, signUp } from "~/utils/session.server";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { LoaderFunction, redirect } from "@remix-run/node";

type ActionData = {
  formError?: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up | Todo with NER" },
    { name: "description", content: "Sign Up for Todo with NER" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (userId) {
    return redirect("/");
  }
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response | ActionData> => {
  const form = await request.formData();
  const email = form.get("email");
  const username = form.get("username");
  const password = form.get("password");

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return {
      formError: "Form not submitted correctly.",
    };
  }

  const user = await signUp(email, username, password);
  if (!user) {
    return {
      formError: "Username or email already exists.",
    };
  }

  return createUserSession(user.id, "/");
};

export default function SignUp() {
  let actionData = useActionData<ActionData | undefined>();

  return (
    <Form
      method="POST"
      className="flex flex-col gap-5 h-screen justify-center w-80 mx-auto"
    >
      <h1 className="text-3xl font-bold">Create an Account!</h1>
      <div className="flex flex-col gap-2">
        <Label>Username</Label>
        <Input placeholder="Username" name="username" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Email</Label>
        <Input placeholder="Email" name="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Password</Label>
        <Input placeholder="Password" type="password" name="password" />
      </div>
      <Button type="submit">Sign Up</Button>
      <p className="text-xs text-destructive">{actionData?.formError}</p>
      <Link
        to="/sign-in"
        className="text-primary text-sm underline text-center"
      >
        Already have an account? Sign in instead!
      </Link>
    </Form>
  );
}
