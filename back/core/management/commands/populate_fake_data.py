from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
import random
import uuid
from faker import Faker
from core.models import (
    PeopleHistory, CompaniesHistory, EmploymentHistory, FamilyRelationships,
    CorrespondenceTypes, Contacts, Correspondence, CorrespondenceContacts,
    Attachments, CorrespondenceProcedures, Permits, ApprovalDecisions,
    Accidents, Relocation, RelocationPeriod, Vehicle, CarPermit,
    CardPermits, CardPhotos
)

User = get_user_model()
fake = Faker(['ar_EG', 'en_US'])  # Arabic and English locales


class Command(BaseCommand):
    help = 'Populate the database with fake data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--people',
            type=int,
            default=50,
            help='Number of people records to create'
        )
        parser.add_argument(
            '--companies',
            type=int,
            default=20,
            help='Number of companies to create'
        )
        parser.add_argument(
            '--correspondence',
            type=int,
            default=100,
            help='Number of correspondence records to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to populate fake data...'))
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        self.clear_existing_data()
        
        # Create fake data
        self.create_users(10)
        self.create_correspondence_types()
        self.create_contacts(30)
        self.create_companies(options['companies'])
        self.create_people(options['people'])
        self.create_employment_history()
        self.create_family_relationships()
        self.create_correspondence(options['correspondence'])
        self.create_permits()
        self.create_accidents()
        self.create_relocations()
        self.create_vehicles()
        self.create_card_permits()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated database with fake data!'))

    def clear_existing_data(self):
        """Clear existing data - be careful with this in production!"""
        self.stdout.write('Clearing existing data...')
        
        # Clear in reverse order of dependencies
        CardPhotos.objects.all().delete()
        CardPermits.objects.all().delete()
        CarPermit.objects.all().delete()
        Vehicle.objects.all().delete()
        RelocationPeriod.objects.all().delete()
        Relocation.objects.all().delete()
        Accidents.objects.all().delete()
        ApprovalDecisions.objects.all().delete()
        Permits.objects.all().delete()
        CorrespondenceProcedures.objects.all().delete()
        Attachments.objects.all().delete()
        CorrespondenceContacts.objects.all().delete()
        Correspondence.objects.all().delete()
        FamilyRelationships.objects.all().delete()
        EmploymentHistory.objects.all().delete()
        PeopleHistory.objects.all().delete()
        CompaniesHistory.objects.all().delete()
        Contacts.objects.all().delete()
        CorrespondenceTypes.objects.all().delete()
        # Keep users for login purposes
        
        self.stdout.write('Existing data cleared.')

    def create_users(self, count):
        """Create fake users"""
        self.stdout.write(f'Creating {count} users...')
        
        # Create admin user if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@securityoffice.com', 'admin123')
        
        for i in range(count):
            User.objects.create_user(
                username=fake.user_name() + str(i),
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password='password123'
            )

    def create_correspondence_types(self):
        """Create correspondence types"""
        self.stdout.write('Creating correspondence types...')
        
        types = [
            'Security Clearance Request',
            'Permit Application',
            'Incident Report',
            'Access Request',
            'Renewal Application',
            'Complaint',
            'Investigation Report',
            'Policy Update',
            'Training Certificate',
            'Emergency Notice'
        ]
        
        for type_name in types:
            CorrespondenceTypes.objects.create(type_name=type_name)

    def create_contacts(self, count):
        """Create fake contacts"""
        self.stdout.write(f'Creating {count} contacts...')
        
        # Create some organization approvers
        organizations = [
            'Ministry of Interior',
            'Security Department',
            'HR Department',
            'Legal Department',
            'Safety Committee'
        ]
        
        for org in organizations:
            Contacts.objects.create(
                name=org,
                contact_type='Organization',
                is_approver=True
            )
        
        # Create individual contacts
        for _ in range(count - len(organizations)):
            Contacts.objects.create(
                name=fake.name(),
                contact_type=random.choice(['Person', 'Organization']),
                is_approver=random.choice([True, False])
            )

    def create_companies(self, count):
        """Create fake companies with version control"""
        self.stdout.write(f'Creating {count} companies...')
        
        company_types = ['Construction', 'Security', 'Maintenance', 'Cleaning', 'Catering', 'IT Services']
        
        for _ in range(count):
            company_name = fake.company()
            CompaniesHistory.objects.create(
                company_name=company_name,
                company_type=random.choice(company_types),
                contact_info=fake.address(),
                start_date=timezone.now() - timedelta(days=random.randint(30, 365)),
                is_current=True,
                version=1
            )

    def create_people(self, count):
        """Create fake people with version control"""
        self.stdout.write(f'Creating {count} people...')
        
        nationalities = ['Egyptian', 'Saudi', 'Jordanian', 'Lebanese', 'Syrian', 'Palestinian']
        qualifications = ['Bachelor', 'Master', 'PhD', 'Diploma', 'High School', 'Technical']
        
        self.people_guids = []  # Store for later use
        
        for _ in range(count):
            person_guid = uuid.uuid4()
            self.people_guids.append(person_guid)
            
            # Arabic name
            arabic_first = random.choice(['أحمد', 'محمد', 'علي', 'حسن', 'خالد', 'عمر', 'يوسف', 'إبراهيم'])
            arabic_last = random.choice(['المصري', 'العربي', 'الشامي', 'الخليجي', 'السوري', 'اللبناني'])
            full_name_arabic = f"{arabic_first} {arabic_last}"
            
            PeopleHistory.objects.create(
                person_guid=person_guid,
                full_name_arabic=full_name_arabic,
                full_name_english=fake.name(),
                nationality=random.choice(nationalities),
                national_id=fake.numerify('##############'),
                access_areas=random.choice(['A', 'B', 'C', 'All Areas']),
                date_of_birth=fake.date_of_birth(minimum_age=20, maximum_age=65),
                qualification=random.choice(qualifications),
                id_address=fake.address(),
                alive=random.choice([True, True, True, False]),  # Mostly alive
                start_date=timezone.now() - timedelta(days=random.randint(1, 730)),
                is_current=True,
                version=1
            )

    def create_employment_history(self):
        """Create employment history records"""
        self.stdout.write('Creating employment history...')
        
        companies = list(CompaniesHistory.objects.filter(is_current=True))
        job_titles = ['Security Guard', 'Supervisor', 'Manager', 'Technician', 'Administrator', 'Cleaner']
        
        for person_guid in self.people_guids[:30]:  # Employment for first 30 people
            EmploymentHistory.objects.create(
                person_guid=person_guid,
                company=random.choice(companies),
                job_title=random.choice(job_titles),
                still_hired=random.choice([True, True, False]),  # Mostly still hired
                start_date=timezone.now() - timedelta(days=random.randint(30, 365)),
                is_current=True,
                version=1
            )

    def create_family_relationships(self):
        """Create family relationships"""
        self.stdout.write('Creating family relationships...')
        
        relationship_types = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother']
        statuses = ['Active', 'Active', 'Active', 'Left', 'Deceased']
        
        # Create relationships for first 20 people (workers)
        for worker_guid in self.people_guids[:20]:
            # Each worker has 1-3 family members
            num_family = random.randint(1, 3)
            family_guids = random.sample(self.people_guids[20:], num_family)
            
            for family_guid in family_guids:
                FamilyRelationships.objects.create(
                    worker_person_guid=worker_guid,
                    family_member_person_guid=family_guid,
                    relationship_type=random.choice(relationship_types),
                    status=random.choice(statuses)
                )

    def create_correspondence(self, count):
        """Create correspondence records"""
        self.stdout.write(f'Creating {count} correspondence records...')
        
        types = list(CorrespondenceTypes.objects.all())
        contacts = list(Contacts.objects.all())
        directions = ['Incoming', 'Outgoing', 'Internal']
        priorities = ['high', 'normal', 'low']
        
        correspondences = []
        
        for i in range(count):
            correspondence = Correspondence.objects.create(
                reference_number=f"SEC-{timezone.now().year}-{i+1:04d}",
                correspondence_date=fake.date_between(start_date='-1y', end_date='today'),
                type=random.choice(types),
                subject=fake.sentence(nb_words=6),
                direction=random.choice(directions),
                priority=random.choice(priorities),
                summary=fake.text(max_nb_chars=200)
            )
            correspondences.append(correspondence)
            
            # Add contacts to correspondence
            selected_contacts = random.sample(contacts, random.randint(1, 3))
            roles = ['Sender', 'Recipient', 'CC']
            
            for j, contact in enumerate(selected_contacts):
                CorrespondenceContacts.objects.create(
                    correspondence=correspondence,
                    contact=contact,
                    role=roles[j % len(roles)]
                )
            
            # Add attachments (some correspondences)
            if random.choice([True, False]):
                Attachments.objects.create(
                    correspondence=correspondence,
                    file_name=fake.file_name(),
                    file_path=f"/media/attachments/{fake.file_name()}",
                    file_type=random.choice(['application/pdf', 'image/jpeg', 'application/docx']),
                    file_size=random.randint(1024, 5242880)  # 1KB to 5MB
                )
        
        # Create procedures for some correspondence
        users = list(User.objects.all())
        statuses = ['Pending', 'In Progress', 'Completed']
        
        for correspondence in random.sample(correspondences, min(50, len(correspondences))):
            CorrespondenceProcedures.objects.create(
                responsible_person=random.choice(users),
                letter=correspondence,
                procedure_date=fake.date_between(start_date=correspondence.correspondence_date, end_date='today'),
                description=fake.text(max_nb_chars=500),
                status=random.choice(statuses),
                notes=fake.text(max_nb_chars=200) if random.choice([True, False]) else None
            )

    def create_permits(self):
        """Create permits and approval decisions"""
        self.stdout.write('Creating permits...')
        
        companies = list(CompaniesHistory.objects.filter(is_current=True))
        approvers = list(Contacts.objects.filter(is_approver=True))
        permit_statuses = ['Pending', 'Active', 'Rejected', 'Expired']
        decision_statuses = ['Pending', 'Approved', 'Rejected']
        
        permits = []
        
        # Person permits
        for person_guid in random.sample(self.people_guids, 30):
            permit = Permits.objects.create(
                permit_holder_type='Person',
                person_guid=person_guid,
                permit_status=random.choice(permit_statuses),
                effective_date=fake.date_between(start_date='-6m', end_date='+6m'),
                expiry_date=fake.date_between(start_date='+6m', end_date='+2y')
            )
            permits.append(permit)
        
        # Company permits
        for company in random.sample(companies, 10):
            permit = Permits.objects.create(
                permit_holder_type='Company',
                company=company,
                permit_status=random.choice(permit_statuses),
                effective_date=fake.date_between(start_date='-6m', end_date='+6m'),
                expiry_date=fake.date_between(start_date='+6m', end_date='+2y')
            )
            permits.append(permit)
        
        # Create approval decisions
        for permit in permits:
            approver = random.choice(approvers)
            ApprovalDecisions.objects.create(
                permit=permit,
                approver_contact=approver,
                decision_status=random.choice(decision_statuses),
                decision_date=fake.date_time_between(start_date='-1y', end_date='now', tzinfo=timezone.get_current_timezone()),
                notes=fake.text(max_nb_chars=300) if random.choice([True, False]) else None
            )

    def create_accidents(self):
        """Create accident records"""
        self.stdout.write('Creating accident records...')
        
        for _ in range(15):
            Accidents.objects.create(
                description=fake.text(max_nb_chars=500),
                person_guid=random.choice(self.people_guids),
                address=fake.address(),
                date=fake.date_between(start_date='-2y', end_date='today')
            )

    def create_relocations(self):
        """Create relocation records"""
        self.stdout.write('Creating relocation records...')
        
        correspondences = list(Correspondence.objects.all())
        approval_statuses = ['انتظار', 'حاصل']
        building_letters = ['A', 'B', 'C', 'D']
        
        relocations = []
        
        for _ in range(20):
            relocation = Relocation.objects.create(
                relocation_letter=random.choice(correspondences) if correspondences else None,
                person_guid=random.choice(self.people_guids),
                approval_status=random.choice(approval_statuses),
                building_number=random.randint(1, 20),
                building_letter=random.choice(building_letters),
                flat_number=random.randint(1, 50)
            )
            relocations.append(relocation)
            
            # Add relocation periods
            RelocationPeriod.objects.create(
                relocation=relocation,
                start_date=fake.date_between(start_date='-1y', end_date='today'),
                end_date=fake.date_between(start_date='today', end_date='+1y')
            )

    def create_vehicles(self):
        """Create vehicle records"""
        self.stdout.write('Creating vehicle records...')
        
        companies = list(CompaniesHistory.objects.filter(is_current=True))
        correspondences = list(Correspondence.objects.all())
        organizations = ['Owner', 'Contractor']
        
        vehicles = []
        
        for i in range(25):
            vehicle = Vehicle.objects.create(
                vehicle_id=i + 1,
                organization=random.choice(organizations),
                correspondence=random.choice(correspondences) if correspondences else None,
                plate_number=fake.license_plate(),
                start_date=fake.date_between(start_date='-1y', end_date='today'),
                end_date=fake.date_between(start_date='today', end_date='+1y') if random.choice([True, False]) else None,
                company=random.choice(companies) if companies else None
            )
            vehicles.append(vehicle)
            
            # Add car permits
            CarPermit.objects.create(
                vehicle=vehicle,
                start_date=vehicle.start_date,
                end_date=vehicle.end_date
            )

    def create_card_permits(self):
        """Create card permits and photos"""
        self.stdout.write('Creating card permits...')
        
        permit_types = ['Temporary', 'Permanent']
        statuses = ['Active', 'Expired', 'Revoked', 'Lost']
        
        for i, person_guid in enumerate(random.sample(self.people_guids, 35)):
            card_permit = CardPermits.objects.create(
                permit_number=f"CARD-{i+1:05d}",
                permit_type=random.choice(permit_types),
                person_guid=person_guid,
                issue_date=fake.date_between(start_date='-2y', end_date='today'),
                expiration_date=fake.date_between(start_date='today', end_date='+2y'),
                status=random.choice(statuses),
                notes=fake.text(max_nb_chars=200) if random.choice([True, False]) else None
            )
            
            # Add photo for some cards
            if random.choice([True, False, False]):  # 1/3 chance
                CardPhotos.objects.create(
                    permit=card_permit,
                    file_name=f"photo_{card_permit.permit_number}.jpg",
                    file_path=f"/media/card_photos/photo_{card_permit.permit_number}.jpg",
                    file_size_bytes=random.randint(50000, 500000),  # 50KB to 500KB
                    mime_type='image/jpeg'
                )

    def print_summary(self):
        """Print summary of created data"""
        self.stdout.write(self.style.SUCCESS('\n=== DATA CREATION SUMMARY ==='))
        self.stdout.write(f"Users: {User.objects.count()}")
        self.stdout.write(f"People History: {PeopleHistory.objects.count()}")
        self.stdout.write(f"Companies History: {CompaniesHistory.objects.count()}")
        self.stdout.write(f"Employment History: {EmploymentHistory.objects.count()}")
        self.stdout.write(f"Family Relationships: {FamilyRelationships.objects.count()}")
        self.stdout.write(f"Correspondence Types: {CorrespondenceTypes.objects.count()}")
        self.stdout.write(f"Contacts: {Contacts.objects.count()}")
        self.stdout.write(f"Correspondence: {Correspondence.objects.count()}")
        self.stdout.write(f"Attachments: {Attachments.objects.count()}")
        self.stdout.write(f"Permits: {Permits.objects.count()}")
        self.stdout.write(f"Accidents: {Accidents.objects.count()}")
        self.stdout.write(f"Relocations: {Relocation.objects.count()}")
        self.stdout.write(f"Vehicles: {Vehicle.objects.count()}")
        self.stdout.write(f"Card Permits: {CardPermits.objects.count()}")
        self.stdout.write(self.style.SUCCESS('=== END SUMMARY ===\n'))
