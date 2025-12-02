"use client";
import React, { useState, useCallback } from "react";

// 🔧 CONFIG: Node URLs from environment variables
const NODES = {
  central: process.env.NEXT_PUBLIC_CENTRAL_URL || "http://localhost:3010",
  node2: process.env.NEXT_PUBLIC_NODE2_URL || "http://localhost:3011",
  node3: process.env.NEXT_PUBLIC_NODE3_URL || "http://localhost:3012",
};

const DEFAULT_SCRIPTS = {
  central: `[
  { "type": "READ" },
  { "type": "SLEEP", "delayMs": 1000 },
  { "type": "UPDATE", "data": { "city": "CentralCity-" } },
  { "type": "READ" }
]`,
  node2: `[
  { "type": "READ" },
  { "type": "SLEEP", "delayMs": 500 },
  { "type": "UPDATE", "data": { "city": "Node2City-" } },
  { "type": "READ" }
]`,
  node3: `[
  { "type": "READ" }
]`,
};

type LogEntry = {
  timestamp: string;
  msg: string;
  type: string;
};

type FormData = {
  username: string;
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  zipcode: string;
  gender: string;
};

type SimErrors = {
  centralInsert: boolean;
  node2Insert: boolean;
  node3Insert: boolean;
  centralScript: boolean;
  node2Script: boolean;
  node3Script: boolean;
};

export default function App() {
  // Global State
  const [userId, setUserId] = useState<number>(42);
  const [isolation, setIsolation] = useState("READ COMMITTED");

  // Form Data State
  const [formData, setFormData] = useState<FormData>({
    username: "",
    first_name: "",
    last_name: "",
    city: "",
    country: "",
    zipcode: "",
    gender: "",
  });

  // Checkbox States (Simulation Errors)
  const [simErrors, setSimErrors] = useState<SimErrors>({
    centralInsert: false,
    node2Insert: false,
    node3Insert: false,
    centralScript: false,
    node2Script: false,
    node3Script: false,
  });

  // Script Content State
  const [scripts, setScripts] = useState(DEFAULT_SCRIPTS);

  // Logging State
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // --- Helper Functions ---

  const addLog = useCallback((msg: string, type = "default") => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [...prev, { timestamp, msg, type }]);
  }, []);

  const clearLog = () => setLogs([]);

  const prettyJson = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSimError = (key: keyof SimErrors) => {
    setSimErrors((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleScriptChange = (node: keyof typeof scripts, value: string) => {
    setScripts((prev) => ({ ...prev, [node]: value }));
  };

  // --- API Logic ---

  const postJson = async (url: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text().catch(() => "");
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      return { status: res.status, body: parsed };
    } catch (e) {
      return { status: "ERR", body: String(e) };
    }
  };

  // --- Action Handlers ---

  const runRecoveryAll = async () => {
    addLog(
      "--- Running recovery on all nodes (central → node2 → node3) ---",
      "header"
    );

    const nodeList = [
      { key: "central", url: NODES.central },
      { key: "node2", url: NODES.node2 },
      { key: "node3", url: NODES.node3 },
    ];

    for (const { key, url } of nodeList) {
      addLog(`Calling ${key} /recovery/run`, "header");
      const res = await postJson(`${url}/recovery/run`, {});
      addLog(
        `${key} /recovery/run → ${res.status}\n${prettyJson(res.body)}`,
        key
      );
    }
    addLog("--- Recovery finished ---", "header");
  };

  const insertOnNode = async (nodeKey: keyof typeof NODES) => {
    const nodeUrl = NODES[nodeKey];

    // Filter out empty strings from formData to mimic original "undefined" behavior
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v !== "")
    );

    const simKey = `${nodeKey}Insert` as keyof SimErrors;
    const body = {
      isolation,
      simReplicationError: simErrors[simKey],
      // userId: Number(userId),
      ...filteredData,
    };

    addLog(`${nodeKey} /txn/insert-auto ← ${prettyJson(body)}`, "header");
    const res = await postJson(`${nodeUrl}/txn/insert-auto`, body);
    addLog(
      `${nodeKey} /txn/insert-auto → ${res.status}\n${prettyJson(res.body)}`,
      nodeKey
    );
  };

  const runScriptedAll = async () => {
    addLog("--- Custom SCRIPTED txns on central / node2 / node3 ---", "header");

    const tasks: Promise<{
      node: string;
      res: { status: number | string; body: unknown };
    }>[] = [];

    const parseSteps = (txt: string, label: string) => {
      if (!txt || !txt.trim()) return null;
      try {
        const parsed = JSON.parse(txt);
        if (!Array.isArray(parsed)) {
          addLog(`${label}: script must be a JSON array of steps`, "header");
          return null;
        }
        return parsed;
      } catch (e) {
        addLog(`${label}: JSON parse error: ${e}`, "header");
        return null;
      }
    };

    const centralSteps = parseSteps(scripts.central, "central");
    const node2Steps = parseSteps(scripts.node2, "node2");
    const node3Steps = parseSteps(scripts.node3, "node3");

    // Helper to queue task
    const queueTask = (
      nodeKey: keyof typeof NODES,
      steps: unknown[],
      simKey: keyof SimErrors
    ) => {
      const body = {
        isolation,
        userId: Number(userId),
        steps,
        simReplicationError: simErrors[simKey],
      };

      const promise = postJson(`${NODES[nodeKey]}/txn/scripted`, body).then(
        (res) => ({
          node: nodeKey,
          res,
        })
      );
      tasks.push(promise);
    };

    if (centralSteps) queueTask("central", centralSteps, "centralScript");
    if (node2Steps) queueTask("node2", node2Steps, "node2Script");
    if (node3Steps) queueTask("node3", node3Steps, "node3Script");

    if (tasks.length === 0) {
      addLog("No valid scripts to run.", "header");
      return;
    }

    const results = await Promise.all(tasks);

    for (const { node, res } of results) {
      addLog(
        `${node} /txn/scripted → ${res.status}\n${prettyJson(res.body)}`,
        node
      );
    }
  };

  // --- Render Helpers ---

  const getLogClass = (type: string) => {
    switch (type) {
      case "central":
        return "text-cyan-400";
      case "node2":
        return "text-yellow-400";
      case "node3":
        return "text-fuchsia-400";
      case "header":
        return "text-blue-400 font-bold";
      default:
        return "text-green-400";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-200 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-gray-100">
            Distributed DB Concurrency Demo
          </h1>
          <p className="text-sm text-gray-400 mt-1">React Control Panel</p>
        </header>

        {/* --- Global Inputs --- */}
        <section className="border border-gray-700 rounded-lg p-4 bg-neutral-800/50">
          <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">
            Global Inputs
          </h3>
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="userId"
                className="text-sm font-medium text-gray-400"
              >
                User ID
              </label>
              <input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value))}
                className="bg-neutral-950 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 w-32"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="isolation"
                className="text-sm font-medium text-gray-400"
              >
                Isolation Level
              </label>
              <select
                id="isolation"
                value={isolation}
                onChange={(e) => setIsolation(e.target.value)}
                className="bg-neutral-950 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="READ UNCOMMITTED">READ UNCOMMITTED</option>
                <option value="READ COMMITTED">READ COMMITTED</option>
                <option value="REPEATABLE READ">REPEATABLE READ</option>
                <option value="SERIALIZABLE">SERIALIZABLE</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearLog}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded transition-colors border border-gray-600"
              >
                Clear Log
              </button>
              <button
                onClick={runRecoveryAll}
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors border border-blue-500"
              >
                Run Recovery All
              </button>
            </div>
          </div>
        </section>

        {/* --- Insert / Update Fields --- */}
        <section className="border border-gray-700 rounded-lg p-4 bg-neutral-800/50">
          <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">
            Insert / Update Fields
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                "username",
                "first_name",
                "last_name",
                "city",
                "country",
                "zipcode",
                "gender",
              ] as const
            ).map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs uppercase text-gray-500 font-bold">
                  {field.replace("_", " ")}
                </label>
                <input
                  name={field}
                  type="text"
                  value={formData[field]}
                  onChange={handleFormChange}
                  className="bg-neutral-950 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            These fields are used for both simple inserts and scripted
            UPDATE/INSERT steps (if not overridden in the script).
          </p>
        </section>

        {/* --- Simple Insert --- */}
        <section className="border border-gray-700 rounded-lg p-4 bg-neutral-800/50">
          <h3 className="text-lg font-semibold text-gray-300 mb-2 border-b border-gray-700 pb-2">
            Simple Insert (Auto-Generated ID)
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Calls <code>/txn/insert-auto</code>. Backend generates new PK,
            inserts locally, then replicates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Central */}
            <div className="bg-neutral-900/50 p-4 rounded border border-gray-800">
              <h4 className="text-cyan-400 font-bold mb-3">Central (Node1)</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.centralInsert}
                    onChange={() => toggleSimError("centralInsert")}
                    className="rounded border-gray-600 bg-neutral-800 text-blue-500 focus:ring-offset-neutral-900"
                  />
                  Simulate Replication Error
                </label>
                <button
                  onClick={() => insertOnNode("central")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-cyan-900/50 px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  Insert on Central
                </button>
              </div>
            </div>

            {/* Node 2 */}
            <div className="bg-neutral-900/50 p-4 rounded border border-gray-800">
              <h4 className="text-yellow-400 font-bold mb-3">Node 2</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.node2Insert}
                    onChange={() => toggleSimError("node2Insert")}
                    className="rounded border-gray-600 bg-neutral-800 text-blue-500 focus:ring-offset-neutral-900"
                  />
                  Simulate Replication Error
                </label>
                <button
                  onClick={() => insertOnNode("node2")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-yellow-400 border border-yellow-900/50 px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  Insert on Node 2
                </button>
              </div>
            </div>

            {/* Node 3 */}
            <div className="bg-neutral-900/50 p-4 rounded border border-gray-800">
              <h4 className="text-fuchsia-400 font-bold mb-3">Node 3</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.node3Insert}
                    onChange={() => toggleSimError("node3Insert")}
                    className="rounded border-gray-600 bg-neutral-800 text-blue-500 focus:ring-offset-neutral-900"
                  />
                  Simulate Replication Error
                </label>
                <button
                  onClick={() => insertOnNode("node3")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-fuchsia-900/50 px-3 py-2 rounded transition-colors text-sm font-medium"
                >
                  Insert on Node 3
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- Custom Scripted Txn --- */}
        <section className="border border-gray-700 rounded-lg p-4 bg-neutral-800/50">
          <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Custom Scripted Transactions
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                JSON Array of steps: <code>READ</code>, <code>UPDATE</code>,{" "}
                <code>SLEEP</code>.
              </p>
            </div>
            <button
              onClick={runScriptedAll}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2 rounded font-bold shadow-lg transition-colors"
            >
              Run Scripts Concurrently
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Central Script */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-cyan-400 font-bold text-sm">
                  Central Script
                </h4>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.centralScript}
                    onChange={() => toggleSimError("centralScript")}
                    className="rounded border-gray-600 bg-neutral-800"
                  />
                  Sim Error
                </label>
              </div>
              <textarea
                value={scripts.central}
                onChange={(e) => handleScriptChange("central", e.target.value)}
                className="w-full h-48 bg-black border border-gray-700 rounded p-2 font-mono text-xs text-green-400 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Node 2 Script */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-yellow-400 font-bold text-sm">
                  Node 2 Script
                </h4>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.node2Script}
                    onChange={() => toggleSimError("node2Script")}
                    className="rounded border-gray-600 bg-neutral-800"
                  />
                  Sim Error
                </label>
              </div>
              <textarea
                value={scripts.node2}
                onChange={(e) => handleScriptChange("node2", e.target.value)}
                className="w-full h-48 bg-black border border-gray-700 rounded p-2 font-mono text-xs text-green-400 focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>

            {/* Node 3 Script */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-fuchsia-400 font-bold text-sm">
                  Node 3 Script
                </h4>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simErrors.node3Script}
                    onChange={() => toggleSimError("node3Script")}
                    className="rounded border-gray-600 bg-neutral-800"
                  />
                  Sim Error
                </label>
              </div>
              <textarea
                value={scripts.node3}
                onChange={(e) => handleScriptChange("node3", e.target.value)}
                className="w-full h-48 bg-black border border-gray-700 rounded p-2 font-mono text-xs text-green-400 focus:outline-none focus:border-fuchsia-500 resize-none"
              />
            </div>
          </div>
        </section>

        {/* --- Log --- */}
        <section className="border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[500px]">
          <div className="bg-neutral-800 p-2 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-300 ml-2">
              Execution Log
            </h3>
            <span className="text-xs text-gray-500 mr-2">
              {logs.length} entries
            </span>
          </div>
          <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs">
            {logs.length === 0 && (
              <span className="text-gray-600">Waiting for actions...</span>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={`mb-1 whitespace-pre-wrap ${getLogClass(log.type)}`}
              >
                <span className="text-gray-600 select-none mr-2">
                  [{log.timestamp.split("T")[1].slice(0, 12)}]
                </span>
                {log.msg}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
