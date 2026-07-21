import type { Metadata } from "next";
import RegistroForm from "@/components/registro/RegistroForm";

export const metadata: Metadata = {
  title: "Criar conta – Portal Fiscal",
};

export default function RegistroPage() {
  return <RegistroForm />;
}
