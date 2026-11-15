-- Official curated resources. Examples are explicitly samples, never live listings.
insert into public.resources(id,title,category,description,url,verified) values
('career','USC Career Center','Career advising','Career advising and current career resources.','https://careers.usc.edu/',true),
('engage','EngageSC','Student organizations','USC student groups and campus involvement.','https://engage.usc.edu/',true),
('research','USC Research · Students & Postdocs','Research','Research information for students across degree levels.','https://research.usc.edu/research-and-scholarship/students/',true),
('graduate','USC Graduate School','Academic development','Graduate student resources and academic guidance.','https://graduateschool.usc.edu/',true),
('network','USC Career Center · Networking','Networking','Start with the Career Center for current networking resources.','https://careers.usc.edu/',true)
on conflict(id) do update set title=excluded.title,category=excluded.category,description=excluded.description,url=excluded.url,verified=excluded.verified;
insert into public.opportunities(id,data,is_sample) values
('sample-data','{"title":"Data science project collaborator","kind":"Project","theme":"technology","sample":true}',true),
('sample-research','{"title":"Research reading group","kind":"Research","theme":"research","sample":true}',true),
('sample-health','{"title":"Community health exploration","kind":"Volunteering","theme":"healthcare","sample":true}',true),
('sample-creative','{"title":"Student portfolio collaboration","kind":"Creative project","theme":"creative arts","sample":true}',true)
on conflict(id) do nothing;
