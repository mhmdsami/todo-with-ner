import { Form, Link, useActionData } from "@remix-run/react";
import { createUserSession, getUserId, signIn } from "~/utils/session.server";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";

type ActionData = {
  formError?: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Sign In | Todo with NER" },
    { name: "description", content: "Sign In into todo with NER" },
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
  const username = form.get("username");
  const password = form.get("password");

  if (typeof username !== "string" || typeof password !== "string") {
    return {
      formError: "Form not submitted correctly.",
    };
  }

  const user = await signIn(username, password);
  if (!user) {
    return {
      formError: "Invalid username or password.",
    };
  }

  return createUserSession(user.id, "/");
};

export default function SignIn() {
  let actionData = useActionData<ActionData | undefined>();

  return (
    <Form
      method="POST"
      className="flex flex-col gap-5 h-screen justify-center w-80 mx-auto"
    >
      <h1 className="text-3xl font-bold">Welcome Back!</h1>
      <div className="flex flex-col gap-2">
        <Label>Username</Label>
        <Input placeholder="Username" name="username" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Password</Label>
        <Input placeholder="Password" type="password" name="password" />
      </div>
      <Button type="submit">Sign In</Button>
      <p className="text-xs text-destructive">{actionData?.formError}</p>
      <Link
        to="/sign-up"
        className="text-primary text-sm underline text-center"
      >
        Don't have an account? Create one now!
      </Link>
    </Form>
  );
}
