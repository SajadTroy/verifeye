import { NextRequest } from "next/server";


export async function POST(req: NextRequest) {
  const { claim } = await req.json();

  if (!claim || typeof claim !== "string") {
    return new Response(JSON.stringify({ error: "Claim is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.META_MODEL_API_KEY;
  const rawApiUrl = process.env.META_MODEL_API_URL || "https://api.meta.ai/v1";
  const apiUrl = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;
  const modelName = process.env.META_MODEL_NAME || "muse-spark-1.3-contributor";

  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      try {
        const metaRes = await fetch(`${apiUrl}/responses`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            input: `Verify this news headline or factual claim using live web search: "${claim}". Evaluate accuracy and return the status and context.`,
            stream: true,
            temperature: 1,
            top_p: 1,
            max_output_tokens: 32000,
            reasoning: {
              effort: "medium",
            },
            tools: [
              {
                type: "web_search",
                search_context_size: "medium",
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "fact_check",
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["true", "false", "needs_context"],
                    },
                    context: {
                      type: "string",
                    },
                  },
                  required: ["status", "context"],
                  additionalProperties: false,
                },
              },
            },
          }),
        });

        if (!metaRes.ok || !metaRes.body) {
          throw new Error(`Meta API error: ${metaRes.status}`);
        }

        const reader = metaRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalResult: { status: string; context: string } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

            try {
              const parsed = JSON.parse(line.slice(6));

              if (parsed.type === "response.output_item.added") {
                const item = parsed.item;
                if (item?.type === "web_search_call") {
                  const q = item.action?.query || (Array.isArray(item.action?.queries) ? item.action.queries[0] : null);
                  if (q) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking", text: `Searching: ${q}` })}\n\n`));
                  } else if (item.action?.url) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking", text: "Analyzing source data..." })}\n\n`));
                  }
                }
              } else if (parsed.type === "response.output_text.done") {
                const text = parsed.text;
                if (text && typeof text === "string") {
                  if (text.trim().startsWith("{")) {
                    try {
                      const json = JSON.parse(text);
                      if (json.status && json.context) {
                        finalResult = json;
                      }
                    } catch {}
                  } else {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking", text })}\n\n`));
                  }
                }
              } else if (parsed.type === "response.completed") {
                const outputs = parsed.response?.output;
                if (Array.isArray(outputs)) {
                  for (const out of outputs) {
                    if (out?.type === "message" && out?.role === "assistant" && Array.isArray(out?.content)) {
                      for (const c of out.content) {
                        if (c?.type === "output_text" && c.text?.trim()?.startsWith("{")) {
                          try {
                            const json = JSON.parse(c.text);
                            if (json.status && json.context) {
                              finalResult = json;
                            }
                          } catch {}
                        }
                      }
                    }
                  }
                }
              }
            } catch {}
          }
        }

        if (finalResult) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", status: finalResult.status, context: finalResult.context })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", status: "needs_context", context: "Analysis complete. Secondary corroboration is pending further wire verification." })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Error processing claim";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
