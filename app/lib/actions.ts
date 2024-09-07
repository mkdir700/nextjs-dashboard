"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(), // coerce is used to convert the value to a number
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // Note: If the forms have many fileds,
  // it's better to use the `entries()` method with JavaScript's `Object.fromEntries()` method
  // const rawFormData = Object.fromEntries(formData.entries());

  // storing values in cents
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql` INSERT INTO INVOICES (CUSTOMER_ID, AMOUNT, STATUS, DATE) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error(error);
    return {
      message: "Database Error: Failed to create invoice",
    };
  }

  // I need to update the cache for the invoices page
  // because the new invoice will be displayed there
  // so I need to clear this cache and tigger a new request to the server using the `revalidatePath` function.
  revalidatePath("/dashboard/invoices");

  // i want to redirect the user back to the `/dashboard/invoices` page,
  // so i can use the `redirect` function to do that.
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE INVOICES
    SET CUSTOMER_ID = ${customerId}, AMOUNT = ${amountInCents}, STATUS = ${status}
    WHERE ID = ${id}
  `;
  } catch (error) {
    return { message: "Database Error: Failed to update invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // For chapter13-error-handling
  // throw new Error("Failed to Delete Invoice");

  try {
    await sql`
    DELETE FROM INVOICES
    WHERE ID = ${id}
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to delete invoice",
    };
  }

  revalidatePath("/dashboard/invoices");
}
