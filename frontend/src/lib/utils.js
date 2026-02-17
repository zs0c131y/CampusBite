import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function getStatusColor(status) {
  const colors = {
    placed: 'bg-blue-100 text-blue-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    processing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    picked_up: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status) {
  const labels = {
    placed: 'Order Placed',
    accepted: 'Accepted',
    processing: 'Preparing',
    ready: 'Ready for Pickup',
    picked_up: 'Picked Up',
    cancelled: 'Cancelled',
    pending: 'Pending',
    success: 'Paid',
    failed: 'Failed',
  }
  return labels[status] || status
}
