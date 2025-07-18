// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";

// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";

// const schema = z.object({
//   name: z.string().min(2, "Nom requis"),
//   email: z.string().email("Email invalide"),
//   password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
//   confirmPassword: z.string().min(6),
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Les mots de passe ne correspondent pas",
//   path: ["confirmPassword"],
// });

// export function RegisterForm() {
//   const form = useForm<z.infer<typeof schema>>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       name: "",
//       email: "",
//       password: "",
//       confirmPassword: "",
//     },
//   });

//   const onSubmit = async (data: z.infer<typeof schema>) => {
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: data.name,
//           email: data.email,
//           password: data.password,
//         }),
//       });

//       const resData = await res.json();

//       if (!res.ok) {
//         toast.error(resData.message || "Erreur lors de l'inscription");
//         return;
//       }

//       toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
//       form.reset();
//     } catch (error) {
//       console.error(error);
//       toast.error("Erreur réseau ou serveur");
//     }
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="name"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Nom</FormLabel>
//               <FormControl>
//                 <Input {...field} placeholder="Votre nom" />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="email"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Email</FormLabel>
//               <FormControl>
//                 <Input {...field} type="email" placeholder="email@example.com" />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="password"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Mot de passe</FormLabel>
//               <FormControl>
//                 <Input {...field} type="password" placeholder="••••••••" />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="confirmPassword"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Confirmer le mot de passe</FormLabel>
//               <FormControl>
//                 <Input {...field} type="password" placeholder="••••••••" />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <Button type="submit" className="w-full">S'inscrire</Button>
//       </form>
//     </Form>
//   );
// }

"use client"; // indispensable ici pour pouvoir utiliser des hooks (useForm etc.)

import React from "react";
import { RegisterForm } from "../../_components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-3xl font-bold mb-6">Créer un compte</h1>
      <RegisterForm />
    </div>
  );
}

