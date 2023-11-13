import {
  Dialog,
  DialogClose,
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
} from "~/components/ui/table";
import { Checkbox } from "~/components/ui/checkbox";
import { requireUserId } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { db } from "~/utils/db.server";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useState } from "react";

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
};

type Entity = {
  text: string;
  type: "ACTION ITEM" | "RELATIVE DAY" | "ABSOLUTE DAY" | "ABSOLUTE DATE";
};

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
}

const getTitleAndDeadline = (entities: Entity[]) => {
  const title = entities.find((entity) => entity.type === "ACTION ITEM")?.text || "";

  const relativeDay = entities.find((entity) => entity.type === "RELATIVE DAY")?.text;
  if (relativeDay) {
    const today = new Date(Date.now()).getDay();
    if (relativeDay.toLowerCase().includes("monday")) {
      return [title, formatDate(new Date(Date.now() + (8 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("tuesday")) {
      return [title, formatDate(new Date(Date.now() + (9 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("wednesday")) {
      return [title, formatDate(new Date(Date.now() + (10 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("thursday")) {
      return [title, formatDate(new Date(Date.now() + (11 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("friday")) {
      return [title, formatDate(new Date(Date.now() + (12 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("saturday")) {
      return [title, formatDate(new Date(Date.now() + (13 - today) * 86400000))];
    } else if (relativeDay.toLowerCase().includes("sunday")) {
      return [title, formatDate(new Date(Date.now() + (7 - today) * 86400000))];
    }
    return [title, formatDate(new Date(Date.now()))];
  }
}

export default function Index() {
  const { user, tasks } = useLoaderData<LoaderData>();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(formatDate(new Date()));

  const handleUseNER = async () => {
    if (!title) return;
    console.log(title)
    const response = await fetch("http://localhost:8000/ner", {
      method: "POST",
      body: JSON.stringify({
        input: title,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success && data.data.length === 2) {
      const [title_, deadline_] = getTitleAndDeadline(data.data);
      setTitle(title_);
      setDeadline(deadline_);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-10 min-h-screen">
      <div className="flex gap-5 self-end">
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
                <Input
                  placeholder="Title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Deadline</Label>
                <Input
                  placeholder="Deadline"
                  type="date"
                  name="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="flex self-end gap-3">
                <Button
                  type="button"
                  className="w-fit font-bold"
                  onClick={handleUseNER}
                >
                  Use NER!
                </Button>
                <DialogClose asChild>
                  <Button type="submit" className="w-fit font-bold">
                    Add!
                  </Button>
                </DialogClose>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
        <Form method="POST" action="/signout">
          <Button type="submit" className="font-bold">
            Logout
          </Button>
        </Form>
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
            {tasks.map(({ id, title, deadline, completed }) => (
              <TableRow key={id}>
                <TableCell className="truncate">{id}</TableCell>
                <TableCell>{title}</TableCell>
                <TableCell>{new Date(deadline).toDateString()}</TableCell>
                <TableCell>{<Checkbox defaultChecked={completed} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
