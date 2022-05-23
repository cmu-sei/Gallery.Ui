/**
 * Gallery API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: v1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Assembly } from './assembly';
import { ConstructorInfo } from './constructorInfo';
import { CustomAttributeData } from './customAttributeData';
import { EventInfo } from './eventInfo';
import { FieldInfo } from './fieldInfo';
import { GenericParameterAttributes } from './genericParameterAttributes';
import { MemberInfo } from './memberInfo';
import { MemberTypes } from './memberTypes';
import { MethodBase } from './methodBase';
import { MethodInfo } from './methodInfo';
import { Module } from './module';
import { PropertyInfo } from './propertyInfo';
import { RuntimeTypeHandle } from './runtimeTypeHandle';
import { StructLayoutAttribute } from './structLayoutAttribute';
import { Type } from './type';
import { TypeAttributes } from './typeAttributes';


export interface TypeInfo { 
    readonly name?: string;
    readonly customAttributes?: Array<CustomAttributeData>;
    readonly isCollectible?: boolean;
    readonly metadataToken?: number;
    readonly isInterface?: boolean;
    memberType?: MemberTypes;
    readonly namespace?: string;
    readonly assemblyQualifiedName?: string;
    readonly fullName?: string;
    assembly?: Assembly;
    module?: Module;
    readonly isNested?: boolean;
    declaringType?: Type;
    declaringMethod?: MethodBase;
    reflectedType?: Type;
    underlyingSystemType?: Type;
    readonly isTypeDefinition?: boolean;
    readonly isArray?: boolean;
    readonly isByRef?: boolean;
    readonly isPointer?: boolean;
    readonly isConstructedGenericType?: boolean;
    readonly isGenericParameter?: boolean;
    readonly isGenericTypeParameter?: boolean;
    readonly isGenericMethodParameter?: boolean;
    readonly isGenericType?: boolean;
    readonly isGenericTypeDefinition?: boolean;
    readonly isSZArray?: boolean;
    readonly isVariableBoundArray?: boolean;
    readonly isByRefLike?: boolean;
    readonly hasElementType?: boolean;
    readonly genericTypeArguments?: Array<Type>;
    readonly genericParameterPosition?: number;
    genericParameterAttributes?: GenericParameterAttributes;
    attributes?: TypeAttributes;
    readonly isAbstract?: boolean;
    readonly isImport?: boolean;
    readonly isSealed?: boolean;
    readonly isSpecialName?: boolean;
    readonly isClass?: boolean;
    readonly isNestedAssembly?: boolean;
    readonly isNestedFamANDAssem?: boolean;
    readonly isNestedFamily?: boolean;
    readonly isNestedFamORAssem?: boolean;
    readonly isNestedPrivate?: boolean;
    readonly isNestedPublic?: boolean;
    readonly isNotPublic?: boolean;
    readonly isPublic?: boolean;
    readonly isAutoLayout?: boolean;
    readonly isExplicitLayout?: boolean;
    readonly isLayoutSequential?: boolean;
    readonly isAnsiClass?: boolean;
    readonly isAutoClass?: boolean;
    readonly isUnicodeClass?: boolean;
    readonly isCOMObject?: boolean;
    readonly isContextful?: boolean;
    readonly isEnum?: boolean;
    readonly isMarshalByRef?: boolean;
    readonly isPrimitive?: boolean;
    readonly isValueType?: boolean;
    readonly isSignatureType?: boolean;
    readonly isSecurityCritical?: boolean;
    readonly isSecuritySafeCritical?: boolean;
    readonly isSecurityTransparent?: boolean;
    structLayoutAttribute?: StructLayoutAttribute;
    typeInitializer?: ConstructorInfo;
    typeHandle?: RuntimeTypeHandle;
    readonly guid?: string;
    baseType?: Type;
    readonly isSerializable?: boolean;
    readonly containsGenericParameters?: boolean;
    readonly isVisible?: boolean;
    readonly genericTypeParameters?: Array<Type>;
    readonly declaredConstructors?: Array<ConstructorInfo>;
    readonly declaredEvents?: Array<EventInfo>;
    readonly declaredFields?: Array<FieldInfo>;
    readonly declaredMembers?: Array<MemberInfo>;
    readonly declaredMethods?: Array<MethodInfo>;
    readonly declaredNestedTypes?: Array<TypeInfo>;
    readonly declaredProperties?: Array<PropertyInfo>;
    readonly implementedInterfaces?: Array<Type>;
}
