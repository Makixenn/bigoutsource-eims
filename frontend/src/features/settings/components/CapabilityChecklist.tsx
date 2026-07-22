import { useMemo } from 'react';
import { Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { CapabilityItem } from '@/src/features/settings/services/roleService';
import { cn } from '@/src/lib/utils';

const DOMAIN_LABELS: Record<string, string> = {
  employees: 'Employees',
  assets: 'IT Assets',
  departments: 'Departments',
  sites: 'Sites',
  imports: 'Imports',
  reports: 'Reports',
  auditlogs: 'Audit Logs',
  notifications: 'Notifications',
};

function domainOf(key: string) {
  return key.split('.')[0];
}

const ONBOARDING_SUB_CAPS = [
  'employees.create.hr_fields',
  'employees.create.it_fields',
];

const NOTIF_SUB_CAPS = [
  'notifications.hr_action.accountAssignment',
  'notifications.hr_action.site',
  'notifications.hr_action.jobTitle',
  'notifications.hr_action.status',
  'notifications.hr_action.employeeStatus',
  'notifications.hr_action.dateHired',
  'notifications.hr_action.birthDate',
  'notifications.hr_action.phoneNumber',
  'notifications.hr_action.address',
  'notifications.hr_action.fullName',
  'notifications.it_action.bigoutsourceEmail',
  'notifications.it_action.rustdeskId',
  'notifications.it_action.pcName',
  'notifications.it_action.windowsKey',
  'notifications.it_action.esetStatus',
  'notifications.it_action.activityWatchStatus',
  'notifications.it_action.lmsAccount',
  'notifications.it_action.emailPassword',
  'notifications.it_action.outlookEmail',
  'notifications.it_action.googleAccount',
  'notifications.it_action.teamsAccount',
  'notifications.it_action.mattermostAccount',
  'notifications.it_action.deviceType',
  'notifications.it_action.biosDate',
  'notifications.hr_action.archive',
  'notifications.it_action.archive',
];

type SegControlState = 'hidden' | 'optional' | 'required';

function SegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: SegControlState;
  onChange: (val: SegControlState) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5 shadow-sm">
      {(['hidden', 'optional', 'required'] as SegControlState[]).map((option) => {
        const isSelected = value === option;
        let selectedClass = '';
        if (isSelected) {
          if (option === 'hidden') selectedClass = 'bg-red-50 text-red-700 font-black shadow-sm';
          else if (option === 'optional') selectedClass = 'bg-white text-[#4B5563] font-black shadow-sm';
          else if (option === 'required') selectedClass = 'bg-[#111827] text-white font-black shadow-sm';
        }
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'px-3 py-1.5 text-[0.6875rem] font-bold capitalize transition-all',
              isSelected ? selectedClass : 'text-[#9CA3AF] hover:text-[#4B5563]',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Capability picker grouped by domain. Shared by the role editor and the
 * per-account permission override modal so both look and behave identically.
 */
export function CapabilityChecklist({
  catalog,
  selected,
  onToggle,
  readOnly = false,
}: {
  catalog: CapabilityItem[];
  selected: string[];
  onToggle: (key: string) => void;
  readOnly?: boolean;
}) {
  // We need to manage suffixed keys for onboarding sub-caps
  // The selected array might contain 'employees.create.hr_identity.required'
  // So we intercept those logic pieces.

  const getSubCapState = (baseKey: string): SegControlState => {
    if (selected.includes(`${baseKey}.required`)) return 'required';
    if (selected.includes(`${baseKey}.optional`)) return 'optional';
    return 'hidden'; // implicit
  };

  const handleSubCapChange = (baseKey: string, newState: SegControlState) => {
    if (readOnly) return;
    // We must inform the parent. The parent's onToggle just toggles.
    // Let's fire onToggle for the old state to remove it, and onToggle for the new state to add it.
    const oldState = getSubCapState(baseKey);
    if (oldState === newState) return;

    if (oldState !== 'hidden') {
      onToggle(`${baseKey}.${oldState}`);
    }
    if (newState !== 'hidden') {
      onToggle(`${baseKey}.${newState}`);
    }
  };

  const grouped = useMemo(() => {
    const byDomain = new Map<string, CapabilityItem[]>();
    for (const item of catalog) {
      if (ONBOARDING_SUB_CAPS.includes(item.key) || NOTIF_SUB_CAPS.includes(item.key)) continue; // skip rendering them as normal checkboxes
      const domain = domainOf(item.key);
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain)!.push(item);
    }
    return [...byDomain.entries()].map(([domain, items]) => ({
      domain,
      label: DOMAIN_LABELS[domain] || domain,
      items,
    }));
  }, [catalog]);

  const renderProgressiveDisclosure = () => {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="mt-4 ml-10 space-y-6 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-6 shadow-inner">
          
          {/* CORE FIELDS */}
          <div>
            <h5 className="mb-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
              Core Fields — Locked, Mandatory for every role
            </h5>
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-[#9CA3AF]" />
                <span className="text-xs font-bold text-[#4B5563]">Full Name · Site / Location · Department · Date Hired</span>
              </div>
              <span className="text-[0.6875rem] font-bold text-[#9CA3AF]">4 fields</span>
            </div>
          </div>

          {/* HR EXCLUSIVE FIELDS */}
          <div>
            <h5 className="mb-3 text-[0.625rem] font-black uppercase tracking-widest text-pink-600">
              HR Exclusive Fields
            </h5>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm transition-colors hover:border-[#D1D5DB]">
              <div className="min-w-0 flex-1">
                <h6 className="text-sm font-black text-[#111827]">Employee Information</h6>
                <p className="mt-0.5 text-[0.6875rem] font-bold text-[#9CA3AF]">Employee ID · Job Title · Birthdate · Phone Number · Address · Employment Status · Float Date</p>
              </div>
              <SegmentedControl
                value={getSubCapState('employees.create.hr_fields')}
                onChange={(val) => handleSubCapChange('employees.create.hr_fields', val)}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* IT EXCLUSIVE FIELDS */}
          <div>
            <h5 className="mb-3 text-[0.625rem] font-black uppercase tracking-widest text-[#0EA5E9]">
              IT Exclusive Fields
            </h5>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm transition-colors hover:border-[#D1D5DB]">
              <div className="min-w-0 flex-1">
                <h6 className="text-sm font-black text-[#111827]">Account & Device Information</h6>
                <p className="mt-0.5 text-[0.6875rem] font-bold text-[#9CA3AF]">Snappy Email · Outlook Email · LMS Account · Mattermost · Teams · Google · Password · PC Name · Remote ID · ESET · ActivityWatch</p>
              </div>
              <SegmentedControl
                value={getSubCapState('employees.create.it_fields')}
                onChange={(val) => handleSubCapChange('employees.create.it_fields', val)}
                disabled={readOnly}
              />
            </div>
          </div>

        </div>
      </motion.div>
    );
  };

  const renderNotifSubCaps = (parentKey: string) => {
    const subCaps = catalog.filter(c => NOTIF_SUB_CAPS.includes(c.key) && c.key.startsWith(parentKey + '.'));
    if (subCaps.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="mt-4 ml-10 space-y-2 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-4 shadow-inner">
          <h5 className="mb-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
            Specific Fields to Notify
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subCaps.map(sub => {
              const checked = selected.includes(sub.key);
              return (
                <label
                  key={sub.key}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    readOnly ? 'cursor-not-allowed opacity-70 border-[#E5E7EB]' : 'cursor-pointer hover:border-[#D1D5DB] hover:bg-white',
                    checked ? 'border-[#111827] bg-white shadow-sm' : 'border-[#E5E7EB] bg-[#F9FAFB]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors',
                      checked ? 'border-[#111827] bg-[#111827]' : 'border-[#D1D5DB] bg-white'
                    )}
                  >
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={readOnly}
                    onChange={() => onToggle(sub.key)}
                  />
                  <span className={cn('text-xs font-bold', checked ? 'text-[#111827]' : 'text-[#4B5563]')}>
                    {sub.label.split('on ')[1] || sub.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.domain}>
          <h4 className="mb-4 text-[0.6875rem] font-black uppercase tracking-widest text-[#9CA3AF]">
            {group.label}
          </h4>
          <div className="flex flex-col gap-3">
            {group.items.map((item) => {
              const checked = selected.includes(item.key);
              const isEmployeeCreate = item.key === 'employees.create';

              return (
                <div key={item.key}>
                  <label
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border p-4 transition-colors',
                      readOnly ? 'cursor-not-allowed opacity-70 border-[#E5E7EB]' : 'cursor-pointer hover:border-[#D1D5DB] hover:bg-[#F9FAFB]',
                      checked ? 'border-[#111827] bg-[#F9FAFB] shadow-sm' : 'border-[#E5E7EB] bg-white'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors',
                        checked ? 'border-[#111827] bg-[#111827]' : 'border-[#D1D5DB] bg-white'
                      )}
                    >
                      {checked && <Check className="h-4 w-4 text-white" />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={readOnly}
                      onChange={() => {
                        onToggle(item.key);
                        
                        // Auto-toggle sub-capabilities for notifications
                        if (item.key === 'notifications.hr_action' || item.key === 'notifications.it_action') {
                          const subCaps = catalog.filter(c => NOTIF_SUB_CAPS.includes(c.key) && c.key.startsWith(item.key + '.'));
                          subCaps.forEach(sub => {
                            if (!checked && !selected.includes(sub.key)) {
                              // Turning ON: select all children
                              onToggle(sub.key);
                            } else if (checked && selected.includes(sub.key)) {
                              // Turning OFF: unselect all children
                              onToggle(sub.key);
                            }
                          });
                        }
                      }}
                    />
                    <div className="flex flex-col">
                      <span className={cn('text-sm font-black', checked ? 'text-[#111827]' : 'text-[#4B5563]')}>
                        {item.label.split('(')[0].trim()}
                      </span>
                      {item.label.includes('(') && (
                        <span className="text-xs font-bold text-[#9CA3AF]">
                          ({item.label.split('(')[1]}
                        </span>
                      )}
                    </div>
                  </label>

                  <AnimatePresence>
                    {isEmployeeCreate && checked && renderProgressiveDisclosure()}
                    {(item.key === 'notifications.hr_action' || item.key === 'notifications.it_action') && checked && renderNotifSubCaps(item.key)}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
