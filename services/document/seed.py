import json
from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from models import Document, Questionnaire, QuestionnaireResponse

STORAGE_DIR = Path("./storage")
SEED_DIR = STORAGE_DIR / "seed"

SEED_DOCUMENTS = [
    dict(PatientId=2, ReferralId=3, Type="Referral Letter", UploadedDate=date(2026, 7, 20), FileName="referral_letter_r3.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=1, ReferralId=4, Type="Referral Letter", UploadedDate=date(2026, 7, 22), FileName="referral_letter_r4.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=3, ReferralId=5, Type="Referral Letter", UploadedDate=date(2026, 7, 12), FileName="referral_letter_r5.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=2, ReferralId=6, Type="Referral Letter", UploadedDate=date(2026, 7, 14), FileName="referral_letter_r6.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=4, ReferralId=7, Type="Referral Letter", UploadedDate=date(2026, 6, 17), FileName="referral_letter_r7.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=4, ReferralId=7, Type="Discharge Summary", UploadedDate=date(2026, 6, 25), FileName="discharge_summary_r7.pdf", StoragePath=str(SEED_DIR / "discharge_summary_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=4, ReferralId=8, Type="Referral Letter", UploadedDate=date(2026, 6, 20), FileName="referral_letter_r8.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=4, ReferralId=8, Type="Discharge Summary", UploadedDate=date(2026, 6, 28), FileName="discharge_summary_r8.pdf", StoragePath=str(SEED_DIR / "discharge_summary_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=5, ReferralId=9, Type="Referral Letter", UploadedDate=date(2026, 7, 7), FileName="referral_letter_r9.pdf", StoragePath=str(SEED_DIR / "referral_letter_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=1, ReferralId=None, Type="Lab Report", UploadedDate=date(2026, 7, 5), FileName="anjali_a1c_labs.pdf", StoragePath=str(SEED_DIR / "lab_report_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=4, ReferralId=None, Type="Lab Report", UploadedDate=date(2026, 6, 10), FileName="suresh_lipid_panel.pdf", StoragePath=str(SEED_DIR / "lab_report_sample.txt"), UploadedBy="Clinician"),
    dict(PatientId=3, ReferralId=None, Type="Imaging", UploadedDate=date(2026, 6, 1), FileName="divya_chest_xray.pdf", StoragePath=str(SEED_DIR / "imaging_sample.txt"), UploadedBy="Clinician"),
]

SEED_QUESTIONNAIRES = [
    dict(
        Title="Pre-Visit Symptom Checklist",
        Description="Please indicate any symptoms you have been experiencing recently",
        QuestionsJson=json.dumps([
            {"id": "fever", "prompt": "Have you experienced fever or elevated temperature?", "type": "checkbox"},
            {"id": "fatigue", "prompt": "Have you felt unusually tired or fatigued?", "type": "checkbox"},
            {"id": "headache", "prompt": "Have you had any headaches?", "type": "checkbox"},
            {"id": "visit_reason", "prompt": "What is the primary reason for your visit today?", "type": "text"},
        ])
    ),
    dict(
        Title="New Patient Intake Form",
        Description="Please provide information about your medical history",
        QuestionsJson=json.dumps([
            {"id": "allergies", "prompt": "Do you have any known allergies?", "type": "text"},
            {"id": "current_medications", "prompt": "What medications are you currently taking?", "type": "text"},
            {"id": "preferred_contact", "prompt": "What is your preferred method of contact?", "type": "select", "options": ["Phone", "Email", "Text Message"]},
            {"id": "emergency_contact", "prompt": "Emergency contact name and phone number", "type": "text"},
        ])
    ),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Document).count() > 0:
        return

    STORAGE_DIR.mkdir(exist_ok=True)
    SEED_DIR.mkdir(exist_ok=True)

    sample_files = {
        SEED_DIR / "referral_letter_sample.txt": "REFERRAL LETTER\n\nThis is a sample referral letter for clinical documentation.",
        SEED_DIR / "discharge_summary_sample.txt": "DISCHARGE SUMMARY\n\nThis is a sample discharge summary for clinical documentation.",
        SEED_DIR / "lab_report_sample.txt": "LABORATORY REPORT\n\nThis is a sample laboratory report with clinical findings.",
        SEED_DIR / "imaging_sample.txt": "IMAGING REPORT\n\nThis is a sample imaging report with radiological findings.",
    }

    for file_path, content in sample_files.items():
        if not file_path.exists():
            file_path.write_text(content)

    for row in SEED_DOCUMENTS:
        db.add(Document(**row))

    for row in SEED_QUESTIONNAIRES:
        db.add(Questionnaire(**row))

    db.commit()
