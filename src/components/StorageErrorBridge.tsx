import { useEffect } from 'react'
import { storageDb } from '../services/storageDb'
import { useToast } from '../shared/ui/Toast'

export default function StorageErrorBridge() {
  const { toast } = useToast()

  useEffect(() => {
    storageDb.onError = (msg) => toast(msg, 'error')
    return () => { storageDb.onError = null }
  }, [toast])

  return null
}
