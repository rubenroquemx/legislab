'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateActivationTokenAction, activateUserAccountAction } from '@/app/actions/usuarios';
import { signIn } from 'next-auth/react';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  UserCheck, 
  Building2, 
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

function ActivarCuentaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setErrorMessage('No se proporcionó ningún token de activación.');
        setLoading(false);
        return;
      }

      try {
        const res = await validateActivationTokenAction(token);
        if (res.valid && res.user) {
          setTokenData(res.user);
          setNombre(res.user.name || '');
        } else {
          setErrorMessage(res.error || 'El enlace de activación es inválido o ha caducado.');
        }
      } catch (e) {
        setErrorMessage('Error al conectar con el servidor de activación.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      alert('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateUserAccountAction(token, {
        password,
        name: nombre,
        phone,
      });

      if (res.success && res.email) {
        setSuccess(true);
        // Iniciar sesión automáticamente
        const loginRes = await signIn('credentials', {
          email: res.email,
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          router.push('/dashboard');
        } else {
          setTimeout(() => {
            router.push('/login?activated=true');
          }, 2000);
        }
      } else {
        alert(res.error || 'No se pudo activar la cuenta');
        setIsSubmitting(false);
      }
    } catch (err) {
      alert('Ocurrió un error inesperado al activar la cuenta');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto animate-pulse">
            <KeyRound className="w-6 h-6 text-zinc-300" />
          </div>
          <h2 className="text-base font-bold text-white">Validando Enlace de Invitación...</h2>
          <p className="text-xs text-zinc-400">Por favor espera un momento mientras preparamos tu cuenta.</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-base font-bold text-white">Enlace no disponible</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{errorMessage}</p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              <span>Ir a la página de inicio de sesión</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900/95 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invitación Oficial a LegisLab</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Activa tu Cuenta de Acceso</h1>
          <p className="text-xs text-zinc-400">
            Has sido invitado a formar parte del sistema de gestión parlamentaria.
          </p>
        </div>

        {/* Despacho & Datos del Usuario */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="font-semibold text-white">{tokenData?.officeName}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-700/40 text-zinc-400">
            <span>Cargo asignado: <strong className="text-zinc-200">{tokenData?.cargo}</strong></span>
            <span className="font-mono text-[11px] text-zinc-300">{tokenData?.email}</span>
          </div>
        </div>

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">¡Cuenta Activada con Éxito!</h3>
            <p className="text-xs text-emerald-300">Iniciando sesión y redirigiendo a tu espacio de trabajo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Tu Nombre Completo</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Lic. Roberto Gómez"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Teléfono / WhatsApp (Opcional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 (993) 000-0000"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Crea tu Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Confirma tu Contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-zinc-900 font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Activando perfil...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Activar Cuenta y Entrar al Despacho</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500">
          ¿Ya activaste tu cuenta previamente?{' '}
          <Link href="/login" className="text-zinc-300 hover:text-white font-semibold underline">
            Inicia Sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActivarCuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-xs">
          Cargando enlace de activación...
        </div>
      }
    >
      <ActivarCuentaContent />
    </Suspense>
  );
}
