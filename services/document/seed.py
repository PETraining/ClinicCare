from datetime import date

from sqlalchemy.orm import Session

from models import Document

# PatientId/ReferralId refs match the Patient/Referral Services' seed data.
SEED_DOCUMENTS = [
    dict(PatientId=2, ReferralId=3, Type="Referral Letter", UploadedDate=date(2026, 7, 20), FileName="referral_letter_r3.pdf"),
    dict(PatientId=1, ReferralId=4, Type="Referral Letter", UploadedDate=date(2026, 7, 22), FileName="referral_letter_r4.pdf"),
    dict(PatientId=3, ReferralId=5, Type="Referral Letter", UploadedDate=date(2026, 7, 12), FileName="referral_letter_r5.pdf"),
    dict(PatientId=2, ReferralId=6, Type="Referral Letter", UploadedDate=date(2026, 7, 14), FileName="referral_letter_r6.pdf"),
    dict(PatientId=4, ReferralId=7, Type="Referral Letter", UploadedDate=date(2026, 6, 17), FileName="referral_letter_r7.pdf"),
    dict(PatientId=4, ReferralId=7, Type="Discharge Summary", UploadedDate=date(2026, 6, 25), FileName="discharge_summary_r7.pdf"),
    dict(PatientId=4, ReferralId=8, Type="Referral Letter", UploadedDate=date(2026, 6, 20), FileName="referral_letter_r8.pdf"),
    dict(PatientId=4, ReferralId=8, Type="Discharge Summary", UploadedDate=date(2026, 6, 28), FileName="discharge_summary_r8.pdf"),
    dict(PatientId=5, ReferralId=9, Type="Referral Letter", UploadedDate=date(2026, 7, 7), FileName="referral_letter_r9.pdf"),
    dict(PatientId=1, ReferralId=None, Type="Lab Report", UploadedDate=date(2026, 7, 5), FileName="anjali_a1c_labs.pdf"),
    dict(PatientId=4, ReferralId=None, Type="Lab Report", UploadedDate=date(2026, 6, 10), FileName="suresh_lipid_panel.pdf"),
    dict(PatientId=3, ReferralId=None, Type="Imaging", UploadedDate=date(2026, 6, 1), FileName="divya_chest_xray.pdf"),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Document).count() > 0:
        return
    for row in SEED_DOCUMENTS:
        db.add(Document(**row))
    db.commit()
