import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { Role } from "@/generated/prisma";

export const authRequire = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) redirect("/login");
  } catch (err) {
    
    redirect("/login");
  }
};

export const unauthRequire = async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session) {
      let redirectPath = "/";
      let dbRole = null;

      if (session.user?.id) {
        // Change "User" and "id" to your actual table and field names if different
        const userFromDb = await prisma.User.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        dbRole = userFromDb?.role;
      }

      if (dbRole === Role.NOUSER) {
        redirectPath = "/set-role";
      } else if (dbRole === Role.RESIDENT) {
        redirectPath = "/resident";
      } else if (dbRole === Role.COMMUNITY_LEADER) {
        redirectPath = "/leader";
      }
      redirect(redirectPath);
    }
};
