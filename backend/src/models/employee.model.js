import { prisma } from '../config/db.js';
import { generateLmsAccount } from '../utils/lmsAccount.js';

export const SITE_OPTIONS = ['HQ', 'Candelaria', 'WFH', 'Hybrid'];
export const STATUS_OPTIONS = ['active', 'pending', 'separated', 'floating'];
export const ESET_OPTIONS = ['active', 'inactive'];
export const ACTIVITY_WATCH_OPTIONS = ['active', 'inactive'];

function undefinedIfBlank(value) {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next === '' ? undefined : next;
}

function stringOrEmpty(value) {
  if (value === undefined) return undefined;
  if (value === null) return '';
  return String(value).trim();
}

function toBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  const next = String(value).trim().toLowerCase();
  if (next === 'true') return true;
  if (next === 'false') return false;
  return Boolean(value);
}

function valueFrom(data, ...keys) {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key];
  }
  return undefined;
}

function canonical(value, allowed, fallback = value) {
  if (value === undefined || value === null || value === '') return value;
  const match = allowed.find((option) => option.toLowerCase() === String(value).trim().toLowerCase());
  return match || fallback;
}

function normalizeSite(value) {
  if (value === undefined || value === null || value === '') return value;
  const next = String(value).trim().toLowerCase();
  if (next === 'can' || next === 'cand' || next === 'candelaria') return 'Candelaria';
  if (next === 'wfh/hybrid' || next === 'hybrid') return 'Hybrid';
  if (next === 'wfh') return 'WFH';
  if (next === 'hq' || next === 'san pablo' || next === 'san pablo city' || next === 'san pablo (hq)' || next === 'san pablo city (hq)') return 'HQ';
  
  const match = SITE_OPTIONS.find((option) => option.toLowerCase() === next);
  return match || value;
}

function normalizeEset(value) {
  if (value === 'installed') return 'active';
  if (value === 'missing' || value === 'update_required') return 'inactive';
  return canonical(value, ESET_OPTIONS, value);
}

function toDatabasePayload(data, { includeId = false } = {}) {
  const payload = {};
  const idRaw = valueFrom(data, 'id', 'employeeId', 'employeeNumber');
  const id = undefinedIfBlank(idRaw);
  const name = stringOrEmpty(valueFrom(data, 'name', 'fullName'));
  const account = stringOrEmpty(valueFrom(data, 'account', 'accountAssignment'));
  const site = stringOrEmpty(valueFrom(data, 'site', 'siteName', 'siteId'));
  const lmsRaw = valueFrom(data, 'lmsAccount', 'lms_account');
  const lmsAccount = lmsRaw !== undefined
    ? stringOrEmpty(lmsRaw)
    : (name !== undefined ? generateLmsAccount(name || '') : undefined);

  if (includeId || id !== undefined) payload.id = id;
  if (name !== undefined) payload.name = name;
  if (account !== undefined) payload.account = account;
  if (valueFrom(data, 'phone', 'phoneNumber') !== undefined) payload.phone_number = stringOrEmpty(valueFrom(data, 'phone', 'phoneNumber'));
  if (data?.address !== undefined) payload.address = stringOrEmpty(data.address);
  if (valueFrom(data, 'boEmail', 'bigoutsourceEmail') !== undefined) {
    payload.bigoutsource_email = stringOrEmpty(valueFrom(data, 'boEmail', 'bigoutsourceEmail'));
  }
  if (data?.emailPassword !== undefined) payload.email_password = stringOrEmpty(data.emailPassword);
  if (data?.avatarUrl !== undefined) payload.avatar_url = stringOrEmpty(data.avatarUrl);
  if (lmsAccount !== undefined) payload.lms_account = lmsAccount;
  if (data?.status !== undefined) payload.status = canonical(data.status, STATUS_OPTIONS, data.status);
  if (site !== undefined) payload.site = normalizeSite(site);
  if (data?.pcName !== undefined) payload.pc_name = stringOrEmpty(data.pcName);
  if (valueFrom(data, 'rustdeskId', 'rustDeskId') !== undefined) {
    payload.rustdesk_id = stringOrEmpty(valueFrom(data, 'rustdeskId', 'rustDeskId'));
  }
  if (data?.esetStatus !== undefined) payload.eset = normalizeEset(data.esetStatus);
  if (data?.biosDate !== undefined) payload.bios_date = stringOrEmpty(data.biosDate);
  if (data?.dateHired !== undefined) payload.date_hired = stringOrEmpty(data.dateHired);
  if (valueFrom(data, 'separationDate', 'separation_date') !== undefined) payload.separation_date = stringOrEmpty(valueFrom(data, 'separationDate', 'separation_date'));
  if (valueFrom(data, 'separationReason', 'separation_reason') !== undefined) payload.separation_reason = stringOrEmpty(valueFrom(data, 'separationReason', 'separation_reason'));
  if (data?.activityWatchStatus !== undefined) {
    payload.activitywatch = canonical(data.activityWatchStatus, ACTIVITY_WATCH_OPTIONS, data.activityWatchStatus);
  }
  if (valueFrom(data, 'windowsKey', 'windowsLicenseKey') !== undefined) {
    payload.windows_license_key = stringOrEmpty(valueFrom(data, 'windowsKey', 'windowsLicenseKey'));
  }
  if (data?.deviceType !== undefined) {
    payload.device_type = stringOrEmpty(data.deviceType);
  }
  if (data?.outlookEmail !== undefined) payload.outlook_email = stringOrEmpty(data.outlookEmail);
  if (data?.teamsAccount !== undefined) payload.teams_account = stringOrEmpty(data.teamsAccount);
  if (data?.mattermostAccount !== undefined) payload.mattermost_account = stringOrEmpty(data.mattermostAccount);
  if (data?.jobTitle !== undefined) payload.position = stringOrEmpty(data.jobTitle);
  if (data?.position !== undefined) payload.position = stringOrEmpty(data.position);
  if (data?.nickname !== undefined) payload.nickname = stringOrEmpty(data.nickname);
  if (data?.sex !== undefined) payload.sex = stringOrEmpty(data.sex);
  if (data?.civilStatus !== undefined) payload.civil_status = stringOrEmpty(data.civilStatus);
  if (valueFrom(data, 'sssNo', 'sss_no') !== undefined) payload.sss_no = stringOrEmpty(valueFrom(data, 'sssNo', 'sss_no'));
  if (valueFrom(data, 'tinNo', 'tin_no') !== undefined) payload.tin_no = stringOrEmpty(valueFrom(data, 'tinNo', 'tin_no'));
  if (valueFrom(data, 'philhealthNo', 'philhealth_no') !== undefined) payload.philhealth_no = stringOrEmpty(valueFrom(data, 'philhealthNo', 'philhealth_no'));
  if (valueFrom(data, 'pagibigNo', 'pagibig_no') !== undefined) payload.pagibig_no = stringOrEmpty(valueFrom(data, 'pagibigNo', 'pagibig_no'));
  if (valueFrom(data, 'personalEmail', 'personal_email') !== undefined) payload.personal_email = stringOrEmpty(valueFrom(data, 'personalEmail', 'personal_email'));
  if (valueFrom(data, 'mainContact', 'main_contact') !== undefined) payload.main_contact = stringOrEmpty(valueFrom(data, 'mainContact', 'main_contact'));
  if (valueFrom(data, 'emergencyContact', 'emergency_contact') !== undefined) payload.emergency_contact = stringOrEmpty(valueFrom(data, 'emergencyContact', 'emergency_contact'));
  if (valueFrom(data, 'emergencyContactNumber', 'emergency_contact_number') !== undefined) payload.emergency_contact_number = stringOrEmpty(valueFrom(data, 'emergencyContactNumber', 'emergency_contact_number'));
  if (data?.birthdate !== undefined) payload.birthdate = stringOrEmpty(data.birthdate);
  if (data?.floatDate !== undefined) payload.float_date = stringOrEmpty(data.floatDate);
  if (data?.employeeStatus !== undefined) payload.employee_status = stringOrEmpty(data.employeeStatus);
  const isArchived = valueFrom(data, 'is_archived', 'isArchived');
  if (isArchived !== undefined) {
    payload.is_archived = toBoolean(isArchived);
  }
  const isReadyForArchive = valueFrom(data, 'is_ready_for_archive', 'isReadyForArchive');
  if (isReadyForArchive !== undefined) {
    payload.is_ready_for_archive = toBoolean(isReadyForArchive);
  }
  if (data?.provisioningStatus !== undefined) {
    payload.provisioning_status = stringOrEmpty(data.provisioningStatus);
  }
  if (data?.idIssuance !== undefined) payload.id_issuance = stringOrEmpty(data.idIssuance);
  if (data?.hoodieIssuance !== undefined) payload.hoodie_issuance = stringOrEmpty(data.hoodieIssuance);
  if (data?.hmoEnrollment !== undefined) payload.hmo_enrollment = stringOrEmpty(data.hmoEnrollment);
  if (data?.hmoMemberCode !== undefined) payload.hmo_member_code = stringOrEmpty(data.hmoMemberCode);
  if (data?.evalFirstMonth !== undefined) payload.eval_first_month = stringOrEmpty(data.evalFirstMonth);
  if (data?.evalThirdMonth !== undefined) payload.eval_third_month = stringOrEmpty(data.evalThirdMonth);
  if (data?.evalFifthMonth !== undefined) payload.eval_fifth_month = stringOrEmpty(data.evalFifthMonth);
  if (data?.evalSixthMonth !== undefined) payload.eval_sixth_month = stringOrEmpty(data.evalSixthMonth);
  if (data?.evalAnniversary !== undefined) payload.eval_anniversary = stringOrEmpty(data.evalAnniversary);
  return payload;
}

function normalize(row) {
  if (!row) return null;

  return {
    id: row.id,
    employeeId: row.id,
    employeeNumber: row.id,
    fullName: row.name || '',
    name: row.name || '',
    account: row.account || '',
    accountAssignment: row.account || '',
    phone: row.phoneNumber || row.phone_number || '',
    phoneNumber: row.phoneNumber || row.phone_number || '',
    address: row.address || '',
    boEmail: row.bigoutsourceEmail || row.bigoutsource_email || '',
    bigoutsourceEmail: row.bigoutsourceEmail || row.bigoutsource_email || '',
    emailPassword: row.emailPassword || row.email_password || '',
    lmsAccount: row.lmsAccount || row.lms_account || '',
    status: row.status || 'active',
    employeeStatus: row.employeeStatus || row.employee_status || 'Regular',
    siteId: row.site || '',
    site: row.site || '',
    pcName: row.pcName || row.pc_name || '',
    biosDate: row.biosDate || row.bios_date || '',
    dateHired: row.dateHired || row.date_hired || '',
    separationDate: row.separationDate || row.separation_date || '',
    separationReason: row.separationReason || row.separation_reason || '',
    windowsKey: row.windowsLicenseKey || row.windows_license_key || '',
    windowsLicenseKey: row.windowsLicenseKey || row.windows_license_key || '',
    deviceType: row.deviceType || row.device_type || 'Windows',
    rustdeskId: row.rustdeskId || row.rustdesk_id || '',
    rustDeskId: row.rustdeskId || row.rustdesk_id || '',
    esetStatus: row.eset || 'inactive',
    eset: row.eset || 'inactive',
    activityWatchStatus: row.activitywatch || 'missing',
    activitywatch: row.activitywatch || 'missing',
    outlookEmail: row.outlookEmail || row.outlook_email || '',
    teamsAccount: row.teamsAccount || row.teams_account || '',
    mattermostAccount: row.mattermostAccount || row.mattermost_account || '',
    jobTitle: row.position || '',
    birthdate: row.birthdate || '',
    floatDate: row.floatDate || row.float_date || '',
    position: row.position || '',
    nickname: row.nickname || '',
    sex: row.sex || '',
    civilStatus: row.civilStatus || row.civil_status || '',
    sssNo: row.sssNo || row.sss_no || '',
    tinNo: row.tinNo || row.tin_no || '',
    philhealthNo: row.philhealthNo || row.philhealth_no || '',
    pagibigNo: row.pagibigNo || row.pagibig_no || '',
    personalEmail: row.personalEmail || row.personal_email || '',
    mainContact: row.mainContact || row.main_contact || '',
    emergencyContact: row.emergencyContact || row.emergency_contact || '',
    emergencyContactNumber: row.emergencyContactNumber || row.emergency_contact_number || '',
    isArchived: row.isArchived ?? row.is_archived ?? false,
    isReadyForArchive: row.isReadyForArchive ?? row.is_ready_for_archive ?? false,
    provisioningStatus: row.provisioningStatus || row.provisioning_status || 'pending_hr',
    idIssuance: row.idIssuance || row.id_issuance || '',
    hoodieIssuance: row.hoodieIssuance || row.hoodie_issuance || '',
    hmoEnrollment: row.hmoEnrollment || row.hmo_enrollment || '',
    hmoMemberCode: row.hmoMemberCode || row.hmo_member_code || '',
    evalFirstMonth: row.evalFirstMonth || row.eval_first_month || '',
    evalThirdMonth: row.evalThirdMonth || row.eval_third_month || '',
    evalFifthMonth: row.evalFifthMonth || row.eval_fifth_month || '',
    evalSixthMonth: row.evalSixthMonth || row.eval_sixth_month || '',
    evalAnniversary: row.evalAnniversary || row.eval_anniversary || '',
    avatarUrl: row.avatarUrl || row.avatar_url || null,
    createdAt: row.createdAt || row.created_at || '',
    updatedAt: row.updatedAt || row.updated_at || '',
  };
}

export const EmployeeModel = {
  async findAll() {
    const rows = await prisma.employee.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map(normalize);
  },

  async findSimilarIdentities(baseIdentifier, lmsBase) {
    const OR = [];
    if (baseIdentifier) {
      OR.push({ bigoutsourceEmail: { startsWith: baseIdentifier, mode: 'insensitive' } });
      OR.push({ pcName: { contains: `-${baseIdentifier}`, mode: 'insensitive' } });
    }
    if (lmsBase) {
      OR.push({ lmsAccount: { startsWith: lmsBase, mode: 'insensitive' } });
    }

    if (OR.length === 0) return [];

    const rows = await prisma.employee.findMany({
      where: { OR },
      select: { id: true, bigoutsourceEmail: true, pcName: true, lmsAccount: true },
    });
    return rows.map(normalize);
  },

  async findById(id) {
    const row = await prisma.employee.findUnique({
      where: { id },
    });
    return normalize(row);
  },

  async findByIdsOrNames(ids = [], names = []) {
    if (ids.length === 0 && names.length === 0) return [];
    
    const OR = [];
    if (ids.length > 0) {
      OR.push({ id: { in: ids } });
    }
    if (names.length > 0) {
      for (const name of names) {
        OR.push({ name: { equals: name, mode: 'insensitive' } });
      }
    }

    const rows = await prisma.employee.findMany({
      where: { OR },
      select: { id: true, name: true },
    });
    return rows.map(normalize);
  },

  async countInactiveUnarchived() {
    return prisma.employee.count({
      where: {
        status: 'inactive',
        isArchived: false,
      },
    });
  },

  async create(data) {
    const payload = toDatabasePayload(data, { includeId: true });
    // mapping payload to prisma format
    const createData = {
      id: payload.id,
      name: payload.name,
      account: payload.account,
      phoneNumber: payload.phone_number,
      address: payload.address,
      bigoutsourceEmail: payload.bigoutsource_email,
      emailPassword: payload.email_password,
      lmsAccount: payload.lms_account,
      status: payload.status,
      employeeStatus: payload.employee_status,
      site: payload.site,
      pcName: payload.pc_name,
      rustdeskId: payload.rustdesk_id,
      eset: payload.eset,
      biosDate: payload.bios_date,
      dateHired: payload.date_hired,
      separationDate: payload.separation_date,
      separationReason: payload.separation_reason,
      activitywatch: payload.activitywatch,
      windowsLicenseKey: payload.windows_license_key,
      deviceType: payload.device_type,
      outlookEmail: payload.outlook_email,
      teamsAccount: payload.teams_account,
      mattermostAccount: payload.mattermost_account,
      jobTitle: payload.job_title,
      birthdate: payload.birthdate,
      floatDate: payload.float_date,
      position: payload.position,
      nickname: payload.nickname,
      sex: payload.sex,
      civilStatus: payload.civil_status,
      sssNo: payload.sss_no,
      tinNo: payload.tin_no,
      philhealthNo: payload.philhealth_no,
      pagibigNo: payload.pagibig_no,
      personalEmail: payload.personal_email,
      mainContact: payload.main_contact,
      emergencyContact: payload.emergency_contact,
      emergencyContactNumber: payload.emergency_contact_number,
      isArchived: payload.is_archived,
      isReadyForArchive: payload.is_ready_for_archive,
      provisioningStatus: payload.provisioning_status,
      idIssuance: payload.id_issuance,
      hoodieIssuance: payload.hoodie_issuance,
      hmoEnrollment: payload.hmo_enrollment,
      hmoMemberCode: payload.hmo_member_code,
      evalFirstMonth: payload.eval_first_month,
      evalThirdMonth: payload.eval_third_month,
      evalFifthMonth: payload.eval_fifth_month,
      evalSixthMonth: payload.eval_sixth_month,
      evalAnniversary: payload.eval_anniversary,
      avatarUrl: payload.avatar_url,
    };
    
    // remove undefined
    Object.keys(createData).forEach(key => createData[key] === undefined ? delete createData[key] : {});

    const row = await prisma.employee.create({
      data: createData,
    });
    return normalize(row);
  },

  async insertMany(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    const payloads = dataArray.map(data => {
      const payload = toDatabasePayload(data, { includeId: true });
      const createData = {
        id: payload.id,
        name: payload.name,
        account: payload.account,
        phoneNumber: payload.phone_number,
        address: payload.address,
        bigoutsourceEmail: payload.bigoutsource_email,
        emailPassword: payload.email_password,
        lmsAccount: payload.lms_account,
        status: payload.status,
        employeeStatus: payload.employee_status,
        site: payload.site,
        pcName: payload.pc_name,
        rustdeskId: payload.rustdesk_id,
        eset: payload.eset,
        biosDate: payload.bios_date,
        dateHired: payload.date_hired,
        separationDate: payload.separation_date,
        separationReason: payload.separation_reason,
        activitywatch: payload.activitywatch,
        outlookEmail: payload.outlook_email,
        teamsAccount: payload.teams_account,
        mattermostAccount: payload.mattermost_account,
        jobTitle: payload.job_title,
        birthdate: payload.birthdate,
        floatDate: payload.float_date,
        position: payload.position,
        nickname: payload.nickname,
        sex: payload.sex,
        civilStatus: payload.civil_status,
        sssNo: payload.sss_no,
        tinNo: payload.tin_no,
        philhealthNo: payload.philhealth_no,
        pagibigNo: payload.pagibig_no,
        personalEmail: payload.personal_email,
        mainContact: payload.main_contact,
        emergencyContact: payload.emergency_contact,
        emergencyContactNumber: payload.emergency_contact_number,
        windowsLicenseKey: payload.windows_license_key,
        deviceType: payload.device_type,
        isArchived: payload.is_archived,
        isReadyForArchive: payload.is_ready_for_archive,
        provisioningStatus: payload.provisioning_status,
        idIssuance: payload.id_issuance,
        hoodieIssuance: payload.hoodie_issuance,
        hmoEnrollment: payload.hmo_enrollment,
        hmoMemberCode: payload.hmo_member_code,
        evalFirstMonth: payload.eval_first_month,
        evalThirdMonth: payload.eval_third_month,
        evalFifthMonth: payload.eval_fifth_month,
        evalSixthMonth: payload.eval_sixth_month,
        evalAnniversary: payload.eval_anniversary,
        avatarUrl: payload.avatar_url,
      };
      Object.keys(createData).forEach(key => createData[key] === undefined ? delete createData[key] : {});
      return createData;
    });

    const result = await prisma.employee.createMany({
      data: payloads,
      skipDuplicates: true,
    });
    
    // If we need the actual rows back, we'd have to find them. Assuming insertMany result count is enough or we fetch them all.
    // The previous implementation mapped the result. `createMany` just returns `{ count: number }` in Prisma.
    // For now we'll return an empty array or fetch them if really needed, but `insertMany` callers usually don't need full returns.
    return []; 
  },

  async update(id, data) {
    const payload = toDatabasePayload(data);
    console.log('--- EmployeeModel Update Payload ---', payload);
    const updateData = {
      id: payload.id,
      name: payload.name,
      account: payload.account,
      phoneNumber: payload.phone_number,
      address: payload.address,
      bigoutsourceEmail: payload.bigoutsource_email,
      emailPassword: payload.email_password,
      lmsAccount: payload.lms_account,
      status: payload.status,
      employeeStatus: payload.employee_status,
      site: payload.site,
      pcName: payload.pc_name,
      rustdeskId: payload.rustdesk_id,
      eset: payload.eset,
      biosDate: payload.bios_date,
      dateHired: payload.date_hired,
      separationDate: payload.separation_date,
      separationReason: payload.separation_reason,
      activitywatch: payload.activitywatch,
      windowsLicenseKey: payload.windows_license_key,
      deviceType: payload.device_type,
      outlookEmail: payload.outlook_email,
      teamsAccount: payload.teams_account,
      mattermostAccount: payload.mattermost_account,
      jobTitle: payload.job_title,
      birthdate: payload.birthdate,
      floatDate: payload.float_date,
      position: payload.position,
      nickname: payload.nickname,
      sex: payload.sex,
      civilStatus: payload.civil_status,
      sssNo: payload.sss_no,
      tinNo: payload.tin_no,
      philhealthNo: payload.philhealth_no,
      pagibigNo: payload.pagibig_no,
      personalEmail: payload.personal_email,
      mainContact: payload.main_contact,
      emergencyContact: payload.emergency_contact,
      emergencyContactNumber: payload.emergency_contact_number,
      isArchived: payload.is_archived,
      isReadyForArchive: payload.is_ready_for_archive,
      provisioningStatus: payload.provisioning_status,
      idIssuance: payload.id_issuance,
      hoodieIssuance: payload.hoodie_issuance,
      hmoEnrollment: payload.hmo_enrollment,
      hmoMemberCode: payload.hmo_member_code,
      evalFirstMonth: payload.eval_first_month,
      evalThirdMonth: payload.eval_third_month,
      evalFifthMonth: payload.eval_fifth_month,
      evalSixthMonth: payload.eval_sixth_month,
      evalAnniversary: payload.eval_anniversary,
      avatarUrl: payload.avatar_url,
    };
    Object.keys(updateData).forEach(key => updateData[key] === undefined ? delete updateData[key] : {});

    const row = await prisma.employee.update({
      where: { id },
      data: updateData,
    });
    return normalize(row);
  },

  async remove(id) {
    await prisma.employee.delete({
      where: { id },
    });
    return true;
  },
};
