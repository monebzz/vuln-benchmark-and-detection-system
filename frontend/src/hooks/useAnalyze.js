import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8001/analyze';

export default function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const analyze = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });

      const data = response.data;

      // Ensure scanned_at exists
      if (!data.scanned_at) {
        data.scanned_at = new Date().toISOString();
      }

      setResults(data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred during analysis.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, results, analyze, reset };
}
