import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import api from '@/lib/api'

const verificationResultCache = new Map()
const verificationRequestCache = new Map()

export default function VerifyEmailPage() {
  const { token } = useParams()

  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const verifyEmail = async () => {
      if (!token) {
        if (!isMounted) return
        setStatus('error')
        setMessage('Invalid verification link. No token was provided.')
        return
      }

      if (verificationResultCache.has(token)) {
        const cached = verificationResultCache.get(token)
        if (!isMounted) return
        setStatus(cached.status)
        setMessage(cached.message)
        return
      }

      try {
        let request = verificationRequestCache.get(token)

        if (!request) {
          request = api
            .post(`/auth/verify-email/${token}`)
            .then(({ data }) => ({
              status: 'success',
              message: data?.message || 'Your email has been verified successfully!',
            }))
            .catch((error) => ({
              status: 'error',
              message:
                error.response?.data?.message ||
                'Email verification failed. The link may have expired or is invalid.',
            }))
            .finally(() => {
              verificationRequestCache.delete(token)
            })

          verificationRequestCache.set(token, request)
        }

        const result = await request
        verificationResultCache.set(token, result)

        if (!isMounted) return
        setStatus(result.status)
        setMessage(result.message)
      } catch (error) {
        if (!isMounted) return
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            'Email verification failed. The link may have expired or is invalid.'
        )
      }
    }

    verifyEmail()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-orange-700 tracking-tight">CampusBite</h1>
          <p className="text-muted-foreground mt-1 text-sm">Email Verification</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">Verify Your Email</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center text-center space-y-6 py-6">
              {/* Loading state */}
              {status === 'loading' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Verifying your email...</p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we confirm your email address.
                    </p>
                  </div>
                </>
              )}

              {/* Success state */}
              {status === 'success' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Email Verified!</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                  </div>
                  <Link to="/login">
                    <Button size="lg">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Go to Login
                      </span>
                    </Button>
                  </Link>
                </>
              )}

              {/* Error state */}
              {status === 'error' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Verification Failed</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link to="/login">
                      <Button variant="outline">Go to Login</Button>
                    </Link>
                    <Link to="/register">
                      <Button>Register Again</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
