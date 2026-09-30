'use client'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import useSWR from 'swr'
import { studyApi } from '@/lib/api/services'
import { SlideContent } from './slide-content'
import { ErrorState, LoadingState } from '../common/states'
export function SlideReview({
  doc,
  page,
  onClose,
}: {
  doc: string
  page: number | null
  onClose: () => void
}) {
  const slide = useSWR(page ? ['slide', doc, page] : null, () => studyApi.slide(doc, page!))
  return (
    <Dialog
      open={page !== null}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-label={`Rivedi slide ${page}`}
    >
      <div className="p-6">
        {slide.error ? (
          <ErrorState onRetry={() => void slide.mutate()} />
        ) : slide.data ? (
          <SlideContent slide={slide.data} />
        ) : (
          <LoadingState />
        )}
        <Button onClick={onClose}>Torna alla verifica</Button>
      </div>
    </Dialog>
  )
}
