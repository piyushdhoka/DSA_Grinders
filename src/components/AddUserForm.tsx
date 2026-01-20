"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddUserFormProps {
  onSuccess: () => void;
}

export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [name, setName] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, leetcodeUsername }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");

      toast.success("User added successfully!");
      setName("");
      setLeetcodeUsername("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Display Name</Label>
        <Input
          type="text"
          id="name"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="leetcode">LeetCode Username</Label>
        <Input
          type="text"
          id="leetcode"
          placeholder="e.g. leetcode_user"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Friend"
        )}
      </Button>
    </form>
  );
}
