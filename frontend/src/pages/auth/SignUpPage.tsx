import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert("Debes aceptar el tratamiento de datos según la Ley 25.326");
      return;
    }
    
    try {
      await axios.post(`${API_URL}/auth/signup`, formData);
      alert("¡Cuenta creada exitosamente! Podés iniciar sesión.");
      navigate("/login");
    } catch (e: any) {
      alert("Error al registrar la cuenta: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Creá tu cuenta</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Automatizá la carga de comprobantes de tu estudio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input 
                type="text" 
                placeholder="Nombre completo" 
                className="h-12 border-slate-200 focus-visible:ring-emerald-500"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input 
                type="email" 
                placeholder="tu@estudio.com.ar" 
                className="h-12 border-slate-200 focus-visible:ring-emerald-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <Input 
                type="password" 
                placeholder="Contraseña (Mín. 8 caracteres)" 
                className="h-12 border-slate-200 focus-visible:ring-emerald-500"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="flex items-start space-x-3 mt-4">
              <Checkbox 
                id="consent" 
                className="mt-1 data-[state=checked]:bg-emerald-600 border-slate-300"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label htmlFor="consent" className="text-xs text-slate-600 leading-tight">
                Declaro ser el titular o profesional autorizado de los datos fiscales a procesar. Acepto los Términos de Servicio y el{" "}
                <Link to="/privacy" className="text-emerald-600 hover:underline">
                  tratamiento de datos según la Ley Nº 25.326
                </Link>.
              </label>
            </div>

            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all">
              Registrar estudio
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400">O continuá con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="h-12 border-slate-200 hover:bg-slate-50 font-medium">
              <FcGoogle className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" type="button" className="h-12 border-slate-200 hover:bg-slate-50 font-medium">
              <BsMicrosoft className="w-5 h-5 mr-2 text-[#00a4ef]" />
              Microsoft
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
