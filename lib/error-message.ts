/** Turn thrown values into short UI copy (timeouts, network, etc.). */
export function formatUserError(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === "AbortError") {
      return "Request timed out — check the network and MagicBlock API, then try again.";
    }
    return e.message;
  }
  return String(e);
}
