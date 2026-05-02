import { redirect } from "next/navigation";

// /faculty was previously a duplicate re-export of /trainers — Google was
// indexing both at identical content (SEO audit item #9). Redirect to the
// canonical /trainers route so only one URL ranks.
export default function FacultyPage(): never {
  redirect("/trainers");
}
