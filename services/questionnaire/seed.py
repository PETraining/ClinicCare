from sqlalchemy.orm import Session

from models import Question, Questionnaire


def seed_if_empty(db: Session) -> None:
    if db.query(Questionnaire).count() > 0:
        return

    q1 = Questionnaire(PatientId=1, ReferralId=4, Title="Pre-Endocrinology Intake", Status="Pending")
    q2 = Questionnaire(PatientId=3, ReferralId=5, Title="Dermatology Symptom Screener", Status="Pending")
    q3 = Questionnaire(PatientId=4, ReferralId=7, Title="Cardiology Follow-up Survey", Status="Pending")
    db.add_all([q1, q2, q3])
    db.flush()

    db.add_all(
        [
            Question(QuestionnaireId=q1.QuestionnaireId, QuestionText="How long have you had diabetes symptoms?", Type="text"),
            Question(QuestionnaireId=q1.QuestionnaireId, QuestionText="Do you currently take insulin?", Type="choice", Choices="Yes,No"),
            Question(QuestionnaireId=q1.QuestionnaireId, QuestionText="Rate your average daily energy level", Type="choice", Choices="Low,Medium,High"),
            Question(QuestionnaireId=q2.QuestionnaireId, QuestionText="Describe the location and appearance of the lesion", Type="text"),
            Question(QuestionnaireId=q2.QuestionnaireId, QuestionText="Has the lesion changed size in the last month?", Type="choice", Choices="Yes,No,Not sure"),
            Question(QuestionnaireId=q3.QuestionnaireId, QuestionText="Have you experienced chest pain since your last visit?", Type="choice", Choices="Yes,No"),
            Question(QuestionnaireId=q3.QuestionnaireId, QuestionText="List any new medications you are taking", Type="text"),
            Question(QuestionnaireId=q3.QuestionnaireId, QuestionText="Rate your shortness of breath during activity", Type="choice", Choices="None,Mild,Moderate,Severe"),
        ]
    )
    db.commit()
