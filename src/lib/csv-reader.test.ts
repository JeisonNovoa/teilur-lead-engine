import { describe, it, expect } from "vitest";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readLeadsFromCsv } from "./csv-reader.js";

async function tempCsv(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "leads-test-"));
  const path = join(dir, "test.csv");
  await writeFile(path, content, "utf-8");
  return path;
}

describe("readLeadsFromCsv", () => {
  it("lee columnas estándar de Apollo", async () => {
    const path = await tempCsv(
      "Company,Website,Title,Email\nAcme,acme.io,CEO,jane@acme.io\n",
    );
    const leads = await readLeadsFromCsv(path);
    expect(leads).toHaveLength(1);
    expect(leads[0].companyName).toBe("Acme");
    expect(leads[0].website).toBe("acme.io");
    expect(leads[0].contactTitle).toBe("CEO");
    expect(leads[0].contactEmail).toBe("jane@acme.io");
  });

  it("reconoce variantes de encabezados (case/espacios)", async () => {
    const path = await tempCsv(
      "Organization Name,Company Website,Job Title\nBeta Corp,beta.com,CTO\n",
    );
    const leads = await readLeadsFromCsv(path);
    expect(leads[0].companyName).toBe("Beta Corp");
    expect(leads[0].website).toBe("beta.com");
    expect(leads[0].contactTitle).toBe("CTO");
  });

  it("salta filas sin nombre de empresa", async () => {
    const path = await tempCsv("Company,Email\n,nada@x.com\nReal Co,real@x.com\n");
    const leads = await readLeadsFromCsv(path);
    expect(leads).toHaveLength(1);
    expect(leads[0].companyName).toBe("Real Co");
  });

  it("devuelve lista vacía si el CSV no tiene filas", async () => {
    const path = await tempCsv("Company,Email\n");
    const leads = await readLeadsFromCsv(path);
    expect(leads).toHaveLength(0);
  });

  it("guarda la fila cruda en raw", async () => {
    const path = await tempCsv("Company,CustomField\nAcme,valor-extra\n");
    const leads = await readLeadsFromCsv(path);
    expect(leads[0].raw?.CustomField).toBe("valor-extra");
  });
});
