import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Layers,
  DoorOpen,
  Plus,
  ArrowLeft,
  ChevronRight,
  Home,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { useProperty } from '@/features/property/property.hooks';
import { useCreateBuilding } from '@/features/building/building.hooks';
import { useCreateFloor } from '@/features/floor/floor.hooks';
import { useCreateUnit } from '@/features/unit/unit.hooks';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { UnitStatus } from '@/types';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useCurrentUser();
  const { data: property, isLoading, refetch } = useProperty(id);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'PROPERTY_ADMIN';

  // Modal States
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(1);

  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [floorName, setFloorName] = useState('');

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('1BHK');
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [area, setArea] = useState<number>(650);
  const [baseRent, setBaseRent] = useState<number>(1500);
  const [maintenanceCharge, setMaintenanceCharge] = useState<number>(100);

  const [formError, setFormError] = useState<string | null>(null);

  const createBuildingMutation = useCreateBuilding();
  const createFloorMutation = useCreateFloor();
  const createUnitMutation = useCreateUnit();

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormError(null);
    try {
      await createBuildingMutation.mutateAsync({
        propertyId: id,
        name: buildingName,
        totalFloors: Number(totalFloors),
      });
      setIsBuildingModalOpen(false);
      setBuildingName('');
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Failed to add building');
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId) return;
    setFormError(null);
    try {
      await createFloorMutation.mutateAsync({
        buildingId: selectedBuildingId,
        floorNumber: Number(floorNumber),
        name: floorName || undefined,
      });
      setIsFloorModalOpen(false);
      setFloorName('');
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Failed to add floor');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorId) return;
    setFormError(null);
    try {
      await createUnitMutation.mutateAsync({
        floorId: selectedFloorId,
        unitNumber,
        unitType,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area: Number(area),
        baseRent: Number(baseRent),
        maintenanceCharge: Number(maintenanceCharge),
        status: 'VACANT' as UnitStatus,
      });
      setIsUnitModalOpen(false);
      setUnitNumber('');
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Failed to add unit');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VACANT':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Vacant
          </Badge>
        );
      case 'OCCUPIED':
        return (
          <Badge variant="info" className="gap-1">
            <Home className="w-3 h-3" /> Occupied
          </Badge>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <Badge variant="warning" className="gap-1">
            <Wrench className="w-3 h-3" /> Maintenance
          </Badge>
        );
      case 'RESERVED':
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="w-3 h-3" /> Reserved
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Building2 className="w-8 h-8 animate-bounce mx-auto text-indigo-600 mb-2" />
        <p>Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Property Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested property does not exist or you do not have permission.</p>
        <Link to="/properties" className="inline-block mt-4">
          <Button variant="outline" size="sm">
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/properties" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-700">{property.name}</span>
      </div>

      {/* Property Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {property.address}, {property.city} {property.state ? `, ${property.state}` : ''}{' '}
                  {property.postalCode || ''}, {property.country || 'USA'}
                </span>
              </div>
            </div>
          </div>
          {property.description && (
            <p className="text-xs text-slate-600 mt-3 max-w-2xl">{property.description}</p>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setFormError(null);
                setIsBuildingModalOpen(true);
              }}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Building
            </Button>
          </div>
        )}
      </div>

      {/* Property Hierarchy Tree: Buildings -> Floors -> Units */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Building Hierarchy & Units
          </h2>
          <span className="text-xs text-slate-500">
            {property.buildings?.length || 0} Buildings
          </span>
        </div>

        {(!property.buildings || property.buildings.length === 0) ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No buildings added yet</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Start building your property hierarchy by adding the first building.
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => setIsBuildingModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Building
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {property.buildings.map((building) => (
              <div
                key={building.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* Building Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>{building.name}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({building.floors?.length || 0} floors)
                    </span>
                  </div>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBuildingId(building.id);
                        setFloorNumber((building.floors?.length || 0) + 1);
                        setFormError(null);
                        setIsFloorModalOpen(true);
                      }}
                      className="h-7 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Floor
                    </Button>
                  )}
                </div>

                {/* Building Floors */}
                <div className="p-4 space-y-3">
                  {(!building.floors || building.floors.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">No floors added to this building yet.</p>
                  ) : (
                    building.floors.map((floor) => (
                      <div
                        key={floor.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Floor {floor.floorNumber}</span>
                            {floor.name && <span className="text-slate-500">({floor.name})</span>}
                            <span className="text-slate-400 font-normal">
                              • {floor.units?.length || 0} Units
                            </span>
                          </div>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFloorId(floor.id);
                                setFormError(null);
                                setIsUnitModalOpen(true);
                              }}
                              className="h-6 px-2 text-[11px] text-indigo-600 hover:bg-indigo-50"
                            >
                              <Plus className="w-3 h-3 mr-0.5" /> Add Unit
                            </Button>
                          )}
                        </div>

                        {/* Units Grid */}
                        {(!floor.units || floor.units.length === 0) ? (
                          <p className="text-[11px] text-slate-400 pl-5">No units on this floor.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pl-2">
                            {floor.units.map((unit) => (
                              <div
                                key={unit.id}
                                className="bg-white rounded-lg border border-slate-200 p-2.5 hover:border-indigo-300 transition-colors shadow-2xs flex flex-col justify-between"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <DoorOpen className="w-4 h-4 text-slate-500" />
                                    <span className="font-bold text-xs text-slate-900">
                                      Unit {unit.unitNumber}
                                    </span>
                                  </div>
                                  {getStatusBadge(unit.status)}
                                </div>

                                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                                  <span>{unit.bedrooms}B / {unit.bathrooms}B</span>
                                  <span className="font-semibold text-slate-800">
                                    ${Number(unit.baseRent).toLocaleString()}/mo
                                  </span>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <Link
                                    to={`/leases?unitId=${unit.id}`}
                                    className="text-indigo-600 hover:underline"
                                  >
                                    Leases
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Building Modal */}
      <Modal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        title="Add Building"
        description={`Add a new building to ${property.name}.`}
        maxWidth="sm"
      >
        <form onSubmit={handleAddBuilding} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}
          <Input
            label="Building Name / Designation"
            required
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder="e.g. Tower A, East Wing"
          />
          <Input
            label="Total Floors"
            type="number"
            min="1"
            value={totalFloors}
            onChange={(e) => setTotalFloors(parseInt(e.target.value, 10))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBuildingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createBuildingMutation.isPending}>
              Add Building
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Floor Modal */}
      <Modal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        title="Add Floor"
        description="Specify the floor number."
        maxWidth="sm"
      >
        <form onSubmit={handleAddFloor} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}
          <Input
            label="Floor Number"
            type="number"
            required
            value={floorNumber}
            onChange={(e) => setFloorNumber(parseInt(e.target.value, 10))}
          />
          <Input
            label="Floor Label / Name (optional)"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            placeholder="e.g. Ground Floor, Penthouse Floor"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFloorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createFloorMutation.isPending}>
              Add Floor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Unit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Add Unit"
        description="Define unit properties and baseline rent."
        maxWidth="md"
      >
        <form onSubmit={handleAddUnit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Number"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 101, 2A"
            />
            <Select
              label="Unit Type"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              options={[
                { label: 'Studio', value: 'Studio' },
                { label: '1BHK', value: '1BHK' },
                { label: '2BHK', value: '2BHK' },
                { label: '3BHK', value: '3BHK' },
                { label: 'Penthouse', value: 'Penthouse' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Bedrooms"
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
            />
            <Input
              label="Bathrooms"
              type="number"
              min="1"
              value={bathrooms}
              onChange={(e) => setBathrooms(parseInt(e.target.value, 10))}
            />
            <Input
              label="Area (sq ft)"
              type="number"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly Base Rent ($)"
              type="number"
              required
              value={baseRent}
              onChange={(e) => setBaseRent(parseFloat(e.target.value))}
            />
            <Input
              label="Maintenance Charge ($)"
              type="number"
              value={maintenanceCharge}
              onChange={(e) => setMaintenanceCharge(parseFloat(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUnitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createUnitMutation.isPending}>
              Create Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

