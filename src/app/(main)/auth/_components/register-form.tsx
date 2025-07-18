"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schéma Zod : uniquement partnerCode
const FormSchema = z.object({
  partnerCode: z.string().min(1, { message: "Le code partenaire est requis." }),
});

// Fonction pour générer un mot de passe sécurisé
function generatePassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  let retVal = "";
  for (let i = 0; i < length; i++) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return retVal;
}

export function RegisterForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      partnerCode: "",
    },
  });

  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const generatedPassword = generatePassword(12);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerCode: data.partnerCode,
          password: generatedPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Erreur lors de l'inscription");
        return;
      }

      form.reset();

      toast.success(
        <>
          ✅ Inscription réussie !<br />
          Votre mot de passe généré est : <strong>{generatedPassword}</strong>
          <br />
          Redirection en cours…
        </>
      );

      // Attendre quelques secondes avant de rediriger
      setTimeout(() => {
        router.push("/auth/v2/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau ou serveur");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="partnerCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code Partenaire</FormLabel>
              <FormControl>
                <Input
                  id="partnerCode"
                  placeholder="Votre code partenaire"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit">
          S&apos;inscrire
        </Button>
      </form>
    </Form>
  );
}
