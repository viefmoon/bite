---
inject: true
to: src/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/infrastructure/persistence/relational/mappers/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.mapper.ts
after: new <%= name %>Entity\(\)
---
<% if (kind === 'primitive') { -%>
  persistenceEntity.<%= property %> = domainEntity.<%= property %>;
<% } else if (kind === 'reference' || kind === 'duplication') { -%>
  <% if (referenceType === 'oneToOne' || referenceType === 'manyToOne') { -%>
    if (domainEntity.<%= property %>) {
      persistenceEntity.<%= property %> = <%= type %>Mapper.toEntity(domainEntity.<%= property %>);
    }
    <% if (isNullable) { -%>
      else if (domainEntity.<%= property %> === null) {
        persistenceEntity.<%= property %> = null;
      }
    <% } -%>
  <% } else if (referenceType === 'oneToMany' || referenceType === 'manyToMany') { -%>
    if (domainEntity.<%= property %>) {
      persistenceEntity.<%= property %> = domainEntity.<%= property %>.map((item) => <%= type %>Mapper.toEntity(item));
    }
    <% if (isNullable) { -%>
      else if (domainEntity.<%= property %> === null) {
        persistenceEntity.<%= property %> = null;
      }
    <% } -%>
  <% } -%>
<% } -%>



