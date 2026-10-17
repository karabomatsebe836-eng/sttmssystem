/*
# Add the initial procurement evaluation framework

1. Data added
- Adds six configurable evaluation criteria for each existing tender only when that tender has no criteria yet.
- Criteria cover price, technical compliance, experience, delivery, quality capability, and legal compliance.
- Percentage weights total exactly 100% for each tender.

2. Persistence
- Criteria remain ordinary rows in `evaluation_criteria` and can be edited or removed by authorised Procurement Officers.
- No evaluation scores or bid results are created.

3. Security
- The existing authenticated Procurement Officer policies continue to control changes to criteria.

4. Important notes
- Future tenders are not forced to use this framework; officers can configure their own criteria.
- Existing tenders with criteria are not changed.
*/

INSERT INTO public.evaluation_criteria (tender_id, criterion_name, criterion_type, description, weight, max_score, is_mandatory, passing_score, sort_order)
SELECT t.id, v.criterion_name, v.criterion_type, v.description, v.weight, 100, v.is_mandatory, v.passing_score, v.sort_order
FROM public.tenders t
CROSS JOIN (VALUES
  ('Price and Value for Money', 'financial', 'Assessment of bid price, total cost of ownership, and value delivered.', 25::numeric, true, 50::numeric, 1),
  ('Technical Compliance', 'technical', 'Alignment with the published technical specifications and mandatory requirements.', 20::numeric, true, 50::numeric, 2),
  ('Relevant Experience and Track Record', 'technical', 'Relevant past work, references, capability, and demonstrated outcomes.', 15::numeric, false, 50::numeric, 3),
  ('Project Delivery Plan and Timeline', 'technical', 'Realism and completeness of the delivery approach, milestones, and timeline.', 15::numeric, true, 50::numeric, 4),
  ('Quality Assurance and Technical Capability', 'technical', 'Quality controls, resources, qualifications, and technical delivery capability.', 15::numeric, false, 50::numeric, 5),
  ('Legal and Regulatory Compliance', 'compliance', 'Compliance with applicable laws, declarations, registrations, and tender conditions.', 10::numeric, true, 50::numeric, 6)
) AS v(criterion_name, criterion_type, description, weight, is_mandatory, passing_score, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.evaluation_criteria existing WHERE existing.tender_id = t.id);
