import {
  Dialog, DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Checkbox } from "~/components/ui/checkbox";
import { requireUserId } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Todo with NER" },
    { name: "description", content: "Todo app with Named Entity Recognition" },
  ];
};

type LoaderData = {
  user: {
    id: string;
    username: string;
    email: string;
  };

  tasks: {
    id: string;
    title: string;
    deadline: string;
    completed: boolean;
  }[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true },
  });

  const tasks =
    (await db.task.findMany({
      where: { userId },
      select: { id: true, title: true, deadline: true, completed: true },
    })) ?? [];

  return json({ user, tasks });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const form = await request.formData();
  const title = form.get("title");
  const deadline = form.get("deadline");

  if (typeof title !== "string" || typeof deadline !== "string") {
    return json({ message: "Form not submitted correctly." }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      title,
      deadline: new Date(deadline),
      userId,
    },
  });

  return json({ message: "Task created successfully", task });
}

export default function Index() {
  const { user, tasks } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4 p-10 min-h-screen">
      <div className="self-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="font-bold">Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add task</DialogTitle>
              <DialogDescription>Add a new task to be done</DialogDescription>
            </DialogHeader>
            <Form method="POST" className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input placeholder="Title" name="title" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Deadline</Label>
                <Input placeholder="Deadline" type="date" name="deadline" />
              </div>
              <DialogClose asChild>
                <Button type="submit" className="w-fit self-end">Add!</Button>
              </DialogClose>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-4xl font-bold">Welcome, {user.username}!</p>
      {tasks.length === 0 ? (
        <p className="flex items-center justify-center grow text-2xl text-primary font-bold -mt-8">
          You don't have any task, add new tasks to get started
        </p>
      ) : (
        <Table className="mt-10 w-2/3 mx-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Task ID</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(({ id, title, deadline, completed}) => (
              <TableRow>
                <TableCell className="truncate">{id}</TableCell>
                <TableCell>{title}</TableCell>
                <TableCell>{(new Date(deadline)).toDateString()}</TableCell>
                <TableCell>{<Checkbox defaultChecked={completed} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
