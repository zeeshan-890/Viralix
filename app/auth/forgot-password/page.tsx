import ResetForm from './reset-form'

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-auto flex justify-center">
                        <h1 className="text-3xl font-bold text-blue-600">AutoReach AI</h1>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        No worries, we&apos;ll send you reset instructions.
                    </p>
                </div>
                <ResetForm />
            </div>
        </div>
    )
}
