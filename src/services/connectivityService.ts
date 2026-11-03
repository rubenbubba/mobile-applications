// Native fallback until the native build adds NetInfo. The web build uses connectivityService.web.ts.
export function isOnline(): boolean {
  return true;
}

export function subscribeToConnectivity(_onChange: () => void): () => void {
  return () => {};
}
