export function setLocalStorageData(name: string, data: any): void {
  try {
    const item = {
      data,
      timestamp: Date.now(), // number
    };
    localStorage.setItem(name, JSON.stringify(item));
  } catch (error) {
    console.error(`Error setting localStorage item '${name}':`, error);
  }
}

export function getLocalStorageData<T = any>(
  name: string
): { data: T; timestamp: number } | null {
  try {
    const jsonData = localStorage.getItem(name);
    if (!jsonData) return null;

    const parsed = JSON.parse(jsonData);
    return {
      data: parsed.data,
      timestamp: Number(parsed.timestamp), // ensure it's a number
    };
  } catch (error) {
    console.error(`Error getting localStorage item '${name}':`, error);
    return null;
  }
}
