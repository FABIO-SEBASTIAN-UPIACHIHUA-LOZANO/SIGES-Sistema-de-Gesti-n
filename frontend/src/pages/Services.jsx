import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Services = () => {
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ cliente_id: '', equipo_id: '', tipo_servicio: 'Reparación', descripcion: '' });

  const fetchServices = () => {
    api.get('/services/').then(res => setServices(res.data));
  };

  useEffect(() => { fetchServices(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    await api.patch(`/services/${id}/status`, { estado: newStatus });
    fetchServices();
  };

  const handleNotify = async (serviceId) => {
    const msg = "Hola, su equipo se encuentra listo para ser recogido en nuestro taller. Gracias por su confianza.";
    await api.post('/notifications/send', { servicio_id: serviceId, mensaje: msg });
    alert('Notificación registrada exitosamente para el cliente.');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ordenes de Servicio</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">#{s.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{s.cliente_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{s.tipo_servicio}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {s.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">S/ {s.monto.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  {['ADMIN', 'TECNICO'].includes(user?.rol) && s.estado !== 'TERMINADO' && (
                    <button
                      onClick={() => handleStatusChange(s.id, 'TERMINADO')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Terminar
                    </button>
                  )}
                  {s.estado === 'TERMINADO' && (
                    <button
                      onClick={() => handleNotify(s.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Avisar al cliente
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};