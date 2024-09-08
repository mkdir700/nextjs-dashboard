"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  console.log(validatedFields);
  // If form validation fails, return error early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  // Note: If the forms have many fileds,
  // it's better to use the `entries()` method with JavaScript's `Object.fromEntries()` method
  // const rawFormData = Object.fromEntries(formData.entries());

  // storing values in cents
  const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
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
