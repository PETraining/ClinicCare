# Lab Module - Technical Specifications & Code Examples

---

## 1. Backend - Lab Service Architecture

### 1.1 Service Structure

```
services/lab/
├── main.py              # FastAPI app + endpoints
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic request/response schemas
├── db.py                # Database & session management
├── seed.py              # Initial data
├── Dockerfile
├── requirements.txt
└── README.md
```

### 1.2 Requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
pydantic==2.9.2
httpx==0.27.2
```

### 1.3 SQLAlchemy Models (models.py)

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from db import Base

class Test(Base):
    __tablename__ = "tests"
    
    test_id = Column(Integer, primary_key=True)
    test_code = Column(String(50), unique=True, nullable=False, index=True)
    test_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    sample_type = Column(String(100), nullable=False)  # blood, urine, etc.
    processing_time_days = Column(Integer, default=1)
    normal_range_min = Column(Float, nullable=True)
    normal_range_max = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)  # mg/dL, etc.
    specialty = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LabOrder(Base):
    __tablename__ = "lab_orders"
    
    order_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, nullable=False, index=True)
    referral_id = Column(Integer, nullable=True, index=True)
    ordered_by = Column(Integer, nullable=False)  # doctor_id
    ordered_date = Column(DateTime, default=datetime.utcnow, index=True)
    priority = Column(String(20), default="routine")  # routine, stat
    clinical_indication = Column(Text, nullable=True)
    status = Column(String(50), default="placed", index=True)  # placed, collected, processing, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order_tests = relationship("OrderTest", back_populates="lab_order", cascade="all, delete-orphan")
    samples = relationship("LabSample", back_populates="lab_order", cascade="all, delete-orphan")


class OrderTest(Base):
    __tablename__ = "order_tests"
    
    order_test_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("lab_orders.order_id"), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.test_id"), nullable=False)
    status = Column(String(50), default="ordered", index=True)  # ordered, collected, processing, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lab_order = relationship("LabOrder", back_populates="order_tests")
    test = relationship("Test")
    result = relationship("TestResult", back_populates="order_test", uselist=False, cascade="all, delete-orphan")


class LabSample(Base):
    __tablename__ = "lab_samples"
    
    sample_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("lab_orders.order_id"), nullable=False)
    sample_type = Column(String(100), nullable=False)
    collection_date = Column(DateTime, nullable=True)
    collected_by = Column(Integer, nullable=True)  # doctor/nurse id
    sample_label = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, collected, processed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lab_order = relationship("LabOrder", back_populates="samples")


class TestResult(Base):
    __tablename__ = "test_results"
    
    result_id = Column(Integer, primary_key=True)
    order_test_id = Column(Integer, ForeignKey("order_tests.order_test_id"), nullable=False)
    result_value = Column(String(500), nullable=False)  # numeric or text
    result_date = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_date = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, nullable=True)  # doctor_id
    is_abnormal = Column(Boolean, default=False)
    is_critical = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    order_test = relationship("OrderTest", back_populates="result")


class StatusHistory(Base):
    __tablename__ = "status_history"
    
    history_id = Column(Integer, primary_key=True)
    order_test_id = Column(Integer, ForeignKey("order_tests.order_test_id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, index=True)
    changed_by = Column(Integer, nullable=True)  # user_id
```

### 1.4 Pydantic Schemas (schemas.py)

```python
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

# Test Schemas
class TestCreate(BaseModel):
    test_code: str = Field(..., min_length=1, max_length=50)
    test_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    sample_type: str = Field(..., min_length=1, max_length=100)
    processing_time_days: int = 1
    normal_range_min: Optional[float] = None
    normal_range_max: Optional[float] = None
    unit: Optional[str] = None
    specialty: str = Field(..., min_length=1, max_length=100)

class TestRead(TestCreate):
    test_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Lab Order Schemas
class OrderTestCreate(BaseModel):
    test_id: int

class LabOrderCreate(BaseModel):
    patient_id: int
    referral_id: Optional[int] = None
    ordered_by: int
    priority: str = "routine"
    clinical_indication: Optional[str] = None
    tests: List[OrderTestCreate]

class OrderTestRead(BaseModel):
    order_test_id: int
    test_id: int
    status: str
    
    class Config:
        from_attributes = True

class LabOrderRead(BaseModel):
    order_id: int
    patient_id: int
    referral_id: Optional[int]
    ordered_by: int
    ordered_date: datetime
    priority: str
    clinical_indication: Optional[str]
    status: str
    order_tests: List[OrderTestRead]
    
    class Config:
        from_attributes = True

# Sample Schemas
class SampleCollectRequest(BaseModel):
    collected_by: int
    collection_date: datetime
    notes: Optional[str] = None

class LabSampleRead(BaseModel):
    sample_id: int
    order_id: int
    sample_type: str
    collection_date: Optional[datetime]
    collected_by: Optional[int]
    sample_label: Optional[str]
    status: str
    
    class Config:
        from_attributes = True

# Result Schemas
class TestResultSubmit(BaseModel):
    order_test_id: int
    result_value: str = Field(..., max_length=500)
    is_abnormal: Optional[bool] = False
    is_critical: Optional[bool] = False
    notes: Optional[str] = None

class TestResultRead(BaseModel):
    result_id: int
    order_test_id: int
    result_value: str
    result_date: datetime
    reviewed_date: Optional[datetime]
    reviewed_by: Optional[int]
    is_abnormal: bool
    is_critical: bool
    notes: Optional[str]
    
    class Config:
        from_attributes = True

# Status Update
class StatusUpdateRequest(BaseModel):
    status: str  # ordered, collected, processing, completed
    changed_by: Optional[int] = None
    notes: Optional[str] = None
```

### 1.5 FastAPI Endpoints (main.py - Key Endpoints)

```python
from fastapi import FastAPI, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import httpx
import os
from datetime import datetime

app = FastAPI(title="Lab Service")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Service URLs
REFERRAL_SERVICE_URL = os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003")
PATIENT_SERVICE_URL = os.environ.get("PATIENT_SERVICE_URL", "http://localhost:8001")

# Test Catalog Endpoints
@app.get("/tests", response_model=list[schemas.TestRead])
def list_tests(
    specialty: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(models.Test)
    if specialty:
        query = query.filter(models.Test.specialty == specialty)
    return query.offset(skip).limit(limit).all()

@app.get("/tests/{test_id}", response_model=schemas.TestRead)
def get_test(test_id: int, db: Session = Depends(get_db)):
    test = db.get(models.Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found")
    return test

@app.post("/tests", response_model=schemas.TestRead, status_code=201)
def create_test(payload: schemas.TestCreate, db: Session = Depends(get_db)):
    # Check duplicate code
    existing = db.query(models.Test).filter(models.Test.test_code == payload.test_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Test code '{payload.test_code}' already exists")
    
    test = models.Test(**payload.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    return test

# Lab Order Endpoints
@app.post("/orders", response_model=schemas.LabOrderRead, status_code=201)
async def create_lab_order(payload: schemas.LabOrderCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(f"{PATIENT_SERVICE_URL}/patients/{payload.patient_id}")
            if resp.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Patient {payload.patient_id} not found")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Patient Service unreachable: {str(e)}")
    
    # Verify referral if provided
    if payload.referral_id:
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{REFERRAL_SERVICE_URL}/referrals/{payload.referral_id}")
                if resp.status_code == 404:
                    raise HTTPException(status_code=400, detail=f"Referral {payload.referral_id} not found")
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Referral Service unreachable: {str(e)}")
    
    # Verify all tests exist
    test_ids = [t.test_id for t in payload.tests]
    existing_tests = db.query(models.Test).filter(models.Test.test_id.in_(test_ids)).all()
    if len(existing_tests) != len(test_ids):
        raise HTTPException(status_code=400, detail="One or more tests not found")
    
    # Create order
    order = models.LabOrder(
        patient_id=payload.patient_id,
        referral_id=payload.referral_id,
        ordered_by=payload.ordered_by,
        priority=payload.priority,
        clinical_indication=payload.clinical_indication,
        status="placed"
    )
    db.add(order)
    db.flush()  # Get order_id
    
    # Create order-test associations
    for test_id in test_ids:
        order_test = models.OrderTest(order_id=order.order_id, test_id=test_id, status="ordered")
        db.add(order_test)
    
    db.commit()
    db.refresh(order)
    return order

@app.get("/orders", response_model=list[schemas.LabOrderRead])
def list_orders(
    patient_id: Optional[int] = None,
    referral_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(models.LabOrder)
    if patient_id:
        query = query.filter(models.LabOrder.patient_id == patient_id)
    if referral_id:
        query = query.filter(models.LabOrder.referral_id == referral_id)
    if status:
        query = query.filter(models.LabOrder.status == status)
    return query.order_by(models.LabOrder.ordered_date.desc()).offset(skip).limit(limit).all()

@app.get("/orders/{order_id}", response_model=schemas.LabOrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.LabOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order

# Sample Collection Endpoint
@app.post("/orders/{order_id}/collect", response_model=schemas.LabSampleRead, status_code=201)
def collect_sample(order_id: int, payload: schemas.SampleCollectRequest, db: Session = Depends(get_db)):
    order = db.get(models.LabOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    
    # Generate sample label (mock)
    sample_label = f"SAMPLE-{order_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    sample = models.LabSample(
        order_id=order_id,
        sample_type=order.order_tests[0].test.sample_type if order.order_tests else "unknown",
        collection_date=payload.collection_date,
        collected_by=payload.collected_by,
        sample_label=sample_label,
        status="collected"
    )
    db.add(sample)
    
    # Update order status
    order.status = "collected"
    for order_test in order.order_tests:
        order_test.status = "collected"
        # Record history
        history = models.StatusHistory(
            order_test_id=order_test.order_test_id,
            old_status="ordered",
            new_status="collected",
            changed_by=payload.collected_by
        )
        db.add(history)
    
    db.commit()
    db.refresh(sample)
    return sample

# Test Result Submission
@app.post("/orders/{order_id}/tests/{test_id}/result", response_model=schemas.TestResultRead, status_code=201)
def submit_result(
    order_id: int,
    test_id: int,
    payload: schemas.TestResultSubmit,
    db: Session = Depends(get_db)
):
    order_test = db.query(models.OrderTest).filter(
        models.OrderTest.order_id == order_id,
        models.OrderTest.test_id == test_id
    ).first()
    
    if not order_test:
        raise HTTPException(status_code=404, detail="Order-Test combination not found")
    
    test = order_test.test
    
    # Validate numeric result if applicable
    try:
        result_float = float(payload.result_value)
        if test.normal_range_min is not None and result_float < test.normal_range_min:
            payload.is_abnormal = True
        if test.normal_range_max is not None and result_float > test.normal_range_max:
            payload.is_abnormal = True
    except ValueError:
        # Text result, skip numeric validation
        pass
    
    result = models.TestResult(
        order_test_id=order_test.order_test_id,
        result_value=payload.result_value,
        is_abnormal=payload.is_abnormal,
        is_critical=payload.is_critical,
        notes=payload.notes
    )
    db.add(result)
    
    # Update order test status
    order_test.status = "completed"
    history = models.StatusHistory(
        order_test_id=order_test.order_test_id,
        old_status="processing",
        new_status="completed"
    )
    db.add(history)
    
    # Check if all tests in order are complete
    all_complete = all(ot.status == "completed" for ot in order_test.lab_order.order_tests)
    if all_complete:
        order_test.lab_order.status = "completed"
    
    db.commit()
    db.refresh(result)
    return result

@app.get("/orders/{order_id}/results", response_model=list[schemas.TestResultRead])
def get_order_results(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.LabOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    
    results = db.query(models.TestResult).join(
        models.OrderTest
    ).filter(
        models.OrderTest.order_id == order_id
    ).all()
    return results
```

---

## 2. Frontend - Clinician Interface (Angular 18)

### 2.1 Lab Module Service (lab.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Test {
  test_id: number;
  test_code: string;
  test_name: string;
  description: string;
  sample_type: string;
  processing_time_days: number;
  normal_range_min: number | null;
  normal_range_max: number | null;
  unit: string | null;
  specialty: string;
}

export interface LabOrder {
  order_id: number;
  patient_id: number;
  referral_id: number | null;
  ordered_by: number;
  ordered_date: string;
  priority: string;
  clinical_indication: string | null;
  status: string;
  order_tests: OrderTest[];
}

export interface OrderTest {
  order_test_id: number;
  test_id: number;
  status: string;
}

export interface TestResult {
  result_id: number;
  order_test_id: number;
  result_value: string;
  result_date: string;
  reviewed_date: string | null;
  reviewed_by: number | null;
  is_abnormal: boolean;
  is_critical: boolean;
  notes: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LabService {
  private apiUrl = '/api/lab';
  
  // Track current patient/referral context
  private currentPatientSubject = new BehaviorSubject<number | null>(null);
  currentPatient$ = this.currentPatientSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // Catalog
  getTests(specialty?: string, skip: number = 0, limit: number = 10): Observable<Test[]> {
    let params = new HttpParams()
      .set('skip', skip)
      .set('limit', limit);
    if (specialty) {
      params = params.set('specialty', specialty);
    }
    return this.http.get<Test[]>(`${this.apiUrl}/tests`, { params });
  }
  
  getTest(testId: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/${testId}`);
  }
  
  // Orders
  createLabOrder(order: {
    patient_id: number;
    referral_id?: number;
    ordered_by: number;
    priority: string;
    clinical_indication?: string;
    tests: { test_id: number }[];
  }): Observable<LabOrder> {
    return this.http.post<LabOrder>(`${this.apiUrl}/orders`, order)
      .pipe(tap(o => this.setCurrentPatient(o.patient_id)));
  }
  
  getOrders(patientId?: number, referralId?: number, status?: string): Observable<LabOrder[]> {
    let params = new HttpParams();
    if (patientId) params = params.set('patient_id', patientId);
    if (referralId) params = params.set('referral_id', referralId);
    if (status) params = params.set('status', status);
    
    return this.http.get<LabOrder[]>(`${this.apiUrl}/orders`, { params });
  }
  
  getOrder(orderId: number): Observable<LabOrder> {
    return this.http.get<LabOrder>(`${this.apiUrl}/orders/${orderId}`);
  }
  
  // Results
  getOrderResults(orderId: number): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.apiUrl}/orders/${orderId}/results`);
  }
  
  reviewResult(resultId: number, reviewedBy: number): Observable<TestResult> {
    return this.http.patch<TestResult>(
      `${this.apiUrl}/results/${resultId}/review`,
      { reviewed_by: reviewedBy }
    );
  }
  
  // Helper
  setCurrentPatient(patientId: number): void {
    this.currentPatientSubject.next(patientId);
  }
}
```

### 2.2 Lab Order Creation Component (create-lab-order.component.ts)

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LabService, Test, LabOrder } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { ReferralService } from '../../core/services/referral.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-lab-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="lab-order-wizard">
      <h2>Create Lab Order</h2>
      
      <!-- Step indicator -->
      <div class="steps">
        <div [class.active]="currentStep === 1">1. Patient</div>
        <div [class.active]="currentStep === 2">2. Referral</div>
        <div [class.active]="currentStep === 3">3. Tests</div>
        <div [class.active]="currentStep === 4">4. Priority</div>
        <div [class.active]="currentStep === 5">5. Review</div>
      </div>
      
      <form [formGroup]="form">
        <!-- Step 1: Patient Selection -->
        <div *ngIf="currentStep === 1">
          <label>Patient</label>
          <input type="number" formControlName="patient_id" placeholder="Enter patient ID">
          <button type="button" (click)="nextStep()">Next</button>
        </div>
        
        <!-- Step 2: Referral Selection -->
        <div *ngIf="currentStep === 2">
          <label>Referral (Optional)</label>
          <input type="number" formControlName="referral_id" placeholder="Enter referral ID (optional)">
          <button type="button" (click)="prevStep()">Back</button>
          <button type="button" (click)="nextStep()">Next</button>
        </div>
        
        <!-- Step 3: Test Selection -->
        <div *ngIf="currentStep === 3">
          <label>Select Tests</label>
          <select [(ngModel)]="selectedSpecialty" (change)="loadTests()">
            <option value="">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Hematology">Hematology</option>
            <option value="Chemistry">Chemistry</option>
          </select>
          
          <div *ngFor="let test of availableTests">
            <label>
              <input type="checkbox" (change)="toggleTest(test)">
              {{ test.test_name }} ({{ test.specialty }})
            </label>
          </div>
          
          <button type="button" (click)="prevStep()">Back</button>
          <button type="button" (click)="nextStep()" [disabled]="selectedTests.length === 0">Next</button>
        </div>
        
        <!-- Step 4: Priority & Indication -->
        <div *ngIf="currentStep === 4">
          <label>Priority</label>
          <select formControlName="priority">
            <option value="routine">Routine</option>
            <option value="stat">STAT (Urgent)</option>
          </select>
          
          <label>Clinical Indication</label>
          <textarea formControlName="clinical_indication" placeholder="Why are these tests ordered?"></textarea>
          
          <button type="button" (click)="prevStep()">Back</button>
          <button type="button" (click)="nextStep()">Next</button>
        </div>
        
        <!-- Step 5: Review -->
        <div *ngIf="currentStep === 5">
          <h3>Review Order</h3>
          <p>Patient: {{ form.get('patient_id')?.value }}</p>
          <p>Referral: {{ form.get('referral_id')?.value || 'None' }}</p>
          <p>Tests: {{ selectedTests.length }} selected</p>
          <p>Priority: {{ form.get('priority')?.value }}</p>
          
          <button type="button" (click)="prevStep()">Back</button>
          <button type="button" (click)="submit()" [disabled]="isLoading">
            {{ isLoading ? 'Submitting...' : 'Submit Order' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .lab-order-wizard {
      max-width: 600px;
      margin: 20px auto;
    }
    .steps {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
    .steps > div {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      text-align: center;
      border-radius: 4px;
    }
    .steps > div.active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class CreateLabOrderComponent implements OnInit {
  form: FormGroup;
  currentStep = 1;
  isLoading = false;
  availableTests: Test[] = [];
  selectedTests: Test[] = [];
  selectedSpecialty = '';
  
  constructor(
    private fb: FormBuilder,
    private labService: LabService,
    private router: Router
  ) {
    this.form = this.fb.group({
      patient_id: ['', [Validators.required, Validators.min(1)]],
      referral_id: [''],
      priority: ['routine'],
      clinical_indication: [''],
      ordered_by: [1]  // In real app, get from auth service
    });
  }
  
  ngOnInit() {
    this.loadTests();
  }
  
  loadTests() {
    this.labService.getTests(this.selectedSpecialty || undefined).subscribe(tests => {
      this.availableTests = tests;
    });
  }
  
  toggleTest(test: Test) {
    const idx = this.selectedTests.findIndex(t => t.test_id === test.test_id);
    if (idx > -1) {
      this.selectedTests.splice(idx, 1);
    } else {
      this.selectedTests.push(test);
    }
  }
  
  nextStep() {
    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }
  
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  submit() {
    if (!this.form.valid || this.selectedTests.length === 0) {
      return;
    }
    
    this.isLoading = true;
    const orderData = {
      ...this.form.value,
      tests: this.selectedTests.map(t => ({ test_id: t.test_id }))
    };
    
    this.labService.createLabOrder(orderData).subscribe({
      next: (order) => {
        this.isLoading = false;
        this.router.navigate(['/lab/orders', order.order_id]);
      },
      error: (err) => {
        this.isLoading = false;
        alert('Error creating order: ' + err.error?.detail || err.message);
      }
    });
  }
}
```

### 2.3 Lab Results Viewer Component (lab-results.component.ts)

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabService, TestResult, Test } from '../../core/services/lab.service';

@Component({
  selector: 'app-lab-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lab-results">
      <h3>Lab Results - Order {{ orderId }}</h3>
      
      <div *ngIf="isLoading" class="loading">Loading results...</div>
      
      <div *ngIf="!isLoading && results.length === 0" class="no-results">
        No results available yet
      </div>
      
      <div *ngFor="let result of results" class="result-card" [class.abnormal]="result.is_abnormal" [class.critical]="result.is_critical">
        <div class="result-header">
          <h4>{{ getTestName(result) }}</h4>
          <span *ngIf="result.is_critical" class="badge critical">CRITICAL</span>
          <span *ngIf="result.is_abnormal && !result.is_critical" class="badge abnormal">ABNORMAL</span>
        </div>
        
        <div class="result-value">
          <strong>{{ result.result_value }}</strong>
          <span class="unit">{{ getTestUnit(result) }}</span>
        </div>
        
        <div *ngIf="getTestRange(result)" class="result-range">
          Normal Range: {{ getTestRange(result) }}
        </div>
        
        <div class="result-meta">
          <span>Completed: {{ result.result_date | date: 'short' }}</span>
          <span *ngIf="result.reviewed_date">Reviewed: {{ result.reviewed_date | date: 'short' }}</span>
          <span *ngIf="!result.reviewed_date" class="status-pending">Pending Review</span>
        </div>
        
        <div *ngIf="result.notes" class="result-notes">
          Notes: {{ result.notes }}
        </div>
        
        <button *ngIf="!result.reviewed_date" (click)="reviewResult(result)" class="btn-primary">
          Acknowledge Result
        </button>
      </div>
      
      <button (click)="printResults()" class="btn-secondary">Print Results</button>
    </div>
  `,
  styles: [`
    .result-card {
      border: 1px solid #ddd;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
      border-left: 5px solid #4CAF50;
    }
    .result-card.abnormal {
      border-left-color: #ff9800;
      background-color: #fff3e0;
    }
    .result-card.critical {
      border-left-color: #f44336;
      background-color: #ffebee;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      margin-left: 10px;
    }
    .badge.abnormal {
      background-color: #ff9800;
      color: white;
    }
    .badge.critical {
      background-color: #f44336;
      color: white;
    }
  `]
})
export class LabResultsComponent implements OnInit {
  @Input() orderId!: number;
  
  results: TestResult[] = [];
  isLoading = false;
  
  constructor(private labService: LabService) {}
  
  ngOnInit() {
    this.loadResults();
  }
  
  loadResults() {
    this.isLoading = true;
    this.labService.getOrderResults(this.orderId).subscribe({
      next: (results) => {
        this.results = results;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading results:', err);
      }
    });
  }
  
  getTestName(result: TestResult): string {
    // In real app, would look up test details from order_test relationship
    return 'Test ' + result.order_test_id;
  }
  
  getTestUnit(result: TestResult): string {
    // Would get from test catalog
    return 'mg/dL';
  }
  
  getTestRange(result: TestResult): string | null {
    // Would get from test catalog
    return '70-100 ' + this.getTestUnit(result);
  }
  
  reviewResult(result: TestResult) {
    const reviewedBy = 1;  // Get from auth service
    this.labService.reviewResult(result.result_id, reviewedBy).subscribe({
      next: () => {
        result.reviewed_date = new Date().toISOString();
        alert('Result acknowledged');
      },
      error: (err) => {
        alert('Error acknowledging result: ' + err.error?.detail);
      }
    });
  }
  
  printResults() {
    window.print();
  }
}
```

---

## 3. Frontend - Technician Interface (Angular 18)

### 3.1 Sample Collection Component

```typescript
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sample-collection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="sample-collection-modal" *ngIf="showModal">
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-content">
        <h3>Mark Sample Collected</h3>
        <form [formGroup]="form">
          <div>
            <label>Collected By (ID)</label>
            <input type="number" formControlName="collected_by" required>
          </div>
          
          <div>
            <label>Collection Date/Time</label>
            <input type="datetime-local" formControlName="collection_date" required>
          </div>
          
          <div>
            <label>Notes (Optional)</label>
            <textarea formControlName="notes"></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
            <button type="button" (click)="submit()" [disabled]="!form.valid" class="btn-primary">
              Confirm Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
    }
    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 400px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      justify-content: flex-end;
    }
  `]
})
export class SampleCollectionComponent {
  @Input() orderId!: number;
  @Input() showModal = false;
  
  form: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      collected_by: ['', Validators.required],
      collection_date: [new Date().toISOString().slice(0, 16), Validators.required],
      notes: ['']
    });
  }
  
  closeModal() {
    this.showModal = false;
  }
  
  submit() {
    if (this.form.valid) {
      // Emit or call service to collect sample
      const data = this.form.value;
      console.log('Sample collected:', data);
      this.closeModal();
    }
  }
}
```

---

## 4. Database Seeding Data (seed.py example)

```python
def seed_if_empty(db: Session):
    if db.query(models.Test).count() > 0:
        return  # Already seeded
    
    tests = [
        models.Test(test_code="CBC", test_name="Complete Blood Count", sample_type="blood", 
                   specialty="Hematology", processing_time_days=1),
        models.Test(test_code="LIPID", test_name="Lipid Panel", sample_type="blood",
                   specialty="Cardiology", normal_range_min=None, normal_range_max=200, unit="mg/dL",
                   processing_time_days=1),
        models.Test(test_code="GLU", test_name="Blood Glucose", sample_type="blood",
                   specialty="Endocrinology", normal_range_min=70, normal_range_max=100, unit="mg/dL",
                   processing_time_days=1),
        # ... add 20+ more tests
    ]
    
    db.add_all(tests)
    db.commit()
```

---

## 5. Docker Configuration

### Dockerfile (services/lab/Dockerfile)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
```

### docker-compose.yml update

```yaml
lab-service:
  build: ./services/lab
  ports:
    - "8006:8006"
  environment:
    PATIENT_SERVICE_URL: http://patient-service:8001
    DOCTORS_SERVICE_URL: http://doctors-service:8002
    REFERRAL_SERVICE_URL: http://referral-service:8003
    NOTIFICATION_SERVICE_URL: http://notification-service:8005
  depends_on:
    - patient-service
    - referral-service
    - notification-service
```

---

## 6. Testing Checklist

### API Testing (Postman/curl)

```bash
# Create test
curl -X POST http://localhost:8006/tests \
  -H "Content-Type: application/json" \
  -d '{
    "test_code": "TST001",
    "test_name": "Test Lab",
    "sample_type": "blood",
    "specialty": "Testing",
    "processing_time_days": 1
  }'

# List tests
curl http://localhost:8006/tests

# Create lab order
curl -X POST http://localhost:8006/orders \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "referral_id": null,
    "ordered_by": 1,
    "priority": "routine",
    "tests": [{"test_id": 1}]
  }'
```

### Manual Frontend Testing

- [ ] Test catalog loads
- [ ] Can create multi-step lab order
- [ ] Order appears in list
- [ ] Can mark sample collected
- [ ] Can submit test result
- [ ] Results display correctly
- [ ] Abnormal flags show properly
- [ ] All styling consistent

---

## 7. Environment Setup Checklist

Before starting development:

- [ ] Clone repo and checkout feature branch
- [ ] `cd frontend && npm install`
- [ ] `pip install -r services/lab/requirements.txt` (for backend testing)
- [ ] `docker-compose up` to verify all services start
- [ ] Verify `http://localhost:4200` loads (frontend)
- [ ] Verify `http://localhost:8006/tests` returns empty list (Lab Service)
- [ ] Verify `http://localhost:8000` responds (Gateway)

---

## 8. Common Mistakes to Avoid

1. **Forgetting to flush() before getting generated IDs** - Use `db.flush()` after `db.add()` if you need the ID
2. **Not validating service dependencies** - Always verify patient/referral exist before creating order
3. **Frontend not calling through gateway** - Use `/api/lab/` not `/lab/` in HTTP calls
4. **Not handling nullable fields** - Use `Optional[]` in Pydantic
5. **Missing error handling** - Always wrap service calls in try/except
6. **Forgetting to add seed data** - If tests are empty, `seed_if_empty()` wasn't called
7. **Status transitions not validated** - Can't go from "ordered" directly to "completed"
8. **Results calculated before form validation** - Validate user input before calculating abnormal flags
