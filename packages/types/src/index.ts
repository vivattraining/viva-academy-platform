export type TenantRecord = {
  tenantName: string;
  brandName: string;
  academyName: string;
  customDomain: string;
  supportEmail: string;
};

export type AcademyApplication = {
  id: string;
  tenantName: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseName: string;
  applicationStage: "applied" | "payment_pending" | "enrolled" | "certificate_issued";
  paymentStage: "not_started" | "order_created" | "paid";
  enrollmentStage: "prospect" | "active" | "completed";
};

export type AcademySession = {
  id: string;
  batchId: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  trainerName: string;
  classroomLink: string;
  zoomMeetingId: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
};

