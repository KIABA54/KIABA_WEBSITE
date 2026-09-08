// Fausse implémentation minimale du query builder supabase-js, en mémoire,
// pour tester des route handlers réels (POST/PATCH...) sans base de données.
// Ne couvre que ce dont ces routes ont besoin : from().select/insert/update/
// delete().eq/neq/order/limit().single/maybeSingle(), et le mode "thenable"
// (await direct sur la chaîne sans méthode terminale, comme le fait
// réellement supabase-js pour un update/delete/insert simple).
type Row = Record<string, unknown>;
type FilterOp = "eq" | "neq";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `mock-id-${idCounter}`;
}

export function createMockSupabase(initial: Record<string, Row[]> = {}) {
  const tables = new Map<string, Row[]>();
  for (const [name, rows] of Object.entries(initial)) {
    tables.set(name, rows.map((r) => ({ ...r })));
  }
  // Déclenche une erreur, une seule fois, sur le prochain insert/update/delete
  // d'une table donnée — pour tester les branches de rollback (ex: la
  // restitution du crédit "1ère annonce gratuite" si l'insert de l'annonce
  // échoue juste après avoir consommé ce crédit).
  const pendingFailures = new Set<string>();

  function getTable(name: string): Row[] {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  }

  function from(tableName: string) {
    const filters: Array<[string, FilterOp, unknown]> = [];
    let pendingInsert: Row | Row[] | null = null;
    let pendingUpdate: Row | null = null;
    let pendingDelete = false;
    let orderBy: { col: string; ascending: boolean } | null = null;
    let limitN: number | null = null;

    function applyFilters(rows: Row[]): Row[] {
      return rows.filter((row) =>
        filters.every(([col, op, val]) => (op === "eq" ? row[col] === val : row[col] !== val))
      );
    }

    async function execute(): Promise<{ data: Row[] | null; error: { message: string } | null }> {
      const table = getTable(tableName);

      const opKind = pendingInsert ? "insert" : pendingUpdate ? "update" : pendingDelete ? "delete" : "select";
      const failureKey = `${tableName}:${opKind}`;
      if (pendingFailures.has(failureKey)) {
        pendingFailures.delete(failureKey);
        return { data: null, error: { message: `Forced failure on ${failureKey} (test)` } };
      }

      if (pendingInsert) {
        const toInsert = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
        const inserted = toInsert.map((r) => ({
          id: nextId(),
          created_at: new Date().toISOString(),
          ...r,
        }));
        table.push(...inserted);
        return { data: inserted, error: null };
      }

      if (pendingUpdate) {
        const matched = applyFilters(table);
        matched.forEach((row) => Object.assign(row, pendingUpdate));
        return { data: matched, error: null };
      }

      if (pendingDelete) {
        const matched = applyFilters(table);
        tables.set(
          tableName,
          table.filter((r) => !matched.includes(r))
        );
        return { data: matched, error: null };
      }

      let result = applyFilters(table);
      if (orderBy) {
        const { col, ascending } = orderBy;
        result = [...result].sort((a, b) => {
          const av = a[col] as string | number;
          const bv = b[col] as string | number;
          if (av === bv) return 0;
          return ascending ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
        });
      }
      if (limitN != null) result = result.slice(0, limitN);
      return { data: result, error: null };
    }

    const builder = {
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, "eq", val]);
        return builder;
      },
      neq(col: string, val: unknown) {
        filters.push([col, "neq", val]);
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderBy = { col, ascending: opts?.ascending !== false };
        return builder;
      },
      limit(n: number) {
        limitN = n;
        return builder;
      },
      insert(row: Row | Row[]) {
        pendingInsert = row;
        return builder;
      },
      update(partial: Row) {
        pendingUpdate = partial;
        return builder;
      },
      delete() {
        pendingDelete = true;
        return builder;
      },
      async maybeSingle() {
        const { data, error } = await execute();
        return { data: data && data.length > 0 ? data[0] : null, error };
      },
      async single() {
        const { data, error } = await execute();
        if (error) return { data: null, error };
        if (!data || data.length === 0) {
          return { data: null, error: { message: "No rows found (mock)" } };
        }
        return { data: data[0], error: null };
      },
      // Permet `await supabase.from(x).update(y).eq(...).eq(...)` sans
      // méthode terminale explicite, comme le fait vraiment supabase-js.
      then(resolve: (v: { data: Row[] | null; error: unknown }) => void, reject: (e: unknown) => void) {
        execute().then(resolve, reject);
      },
    };

    return builder;
  }

  return {
    from,
    /** Accès direct aux lignes stockées, pour les assertions de test. */
    _dump(tableName: string): Row[] {
      return getTable(tableName).map((r) => ({ ...r }));
    },
    /** Fait échouer, une seule fois, le prochain insert/update/delete sur cette table. */
    _failNextOn(tableName: string, op: "insert" | "update" | "delete") {
      pendingFailures.add(`${tableName}:${op}`);
    },
  };
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;
